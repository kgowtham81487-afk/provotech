import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AIProviderHealth, AIProviderConfiguration } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GroqProvider } from './providers/groq.provider';
import {
  AiProvider,
  AiProviderName,
  AiMessageInput,
  AiGenerateOptions,
  AiGenerateResult,
  AiTestResult,
  AiAuthError,
  AiRateLimitError,
  AiQuotaError,
  AiServerError,
  AiEmptyResponseError,
} from './providers/ai-provider.interface';

export interface ProviderStatusInfo {
  provider: AiProviderName;
  name: string;
  isEnabled: boolean;
  isPreferred: boolean;
  priority: number;
  model: string;
  isConfigured: boolean;
  isHealthy: boolean;
  inCooldown: boolean;
  cooldownUntil: Date | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastErrorMessage: string | null;
}

@Injectable()
export class FallbackEngineService {
  private readonly logger = new Logger(FallbackEngineService.name);
  private readonly providers: Map<AiProviderName, AiProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiProvider,
    private readonly deepseek: DeepSeekProvider,
    private readonly groq: GroqProvider,
  ) {
    this.providers = new Map<AiProviderName, AiProvider>([
      ['GEMINI', this.gemini],
      ['DEEPSEEK', this.deepseek],
      ['GROQ', this.groq],
    ]);
  }

  /**
   * Executes AI generation across the provider chain with automatic resilient fallback.
   */
  async executeWithFallback(
    messages: AiMessageInput[],
    options?: AiGenerateOptions,
  ): Promise<{ result: AiGenerateResult; fallbackOccurred: boolean; attempts: Array<{ provider: string; error?: string }> }> {
    const configs = await this.getEffectiveProviderChain();
    const attempts: Array<{ provider: string; error?: string }> = [];

    let fallbackOccurred = false;

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      const provider = this.providers.get(cfg.provider as AiProviderName);

      if (!provider) {
        continue;
      }

      if (!cfg.isEnabled) {
        this.logger.debug(`Skipping disabled AI provider: ${cfg.provider}`);
        continue;
      }

      if (!provider.isConfigured()) {
        this.logger.warn(`Provider ${cfg.provider} is enabled in DB but API key is missing from environment variables.`);
        attempts.push({ provider: cfg.provider, error: 'API key not configured in environment' });
        continue;
      }

      // Check temporary cooldown
      const health = await this.prisma.aIProviderHealth.findUnique({
        where: { provider: cfg.provider },
      });

      if (health?.cooldownUntil && new Date() < health.cooldownUntil) {
        this.logger.warn(`Provider ${cfg.provider} is currently in cooldown until ${health.cooldownUntil.toISOString()}`);
        attempts.push({ provider: cfg.provider, error: `In cooldown until ${health.cooldownUntil.toISOString()}` });
        fallbackOccurred = true;
        continue;
      }

      try {
        this.logger.log(`Attempting AI generation with provider: ${cfg.provider} (model: ${cfg.model})`);

        // Execute generation
        const result = await this.executeProviderWithRetry(provider, messages, {
          ...options,
          model: cfg.model,
          timeoutMs: cfg.timeoutMs,
          maxTokens: cfg.maxTokens,
          temperature: cfg.temperature,
        });

        // Record success in health table
        await this.recordProviderSuccess(cfg.provider);

        return {
          result,
          fallbackOccurred: i > 0 || fallbackOccurred,
          attempts,
        };
      } catch (err: any) {
        this.logger.error(`Provider ${cfg.provider} generation failed: ${err.message}`);
        attempts.push({ provider: cfg.provider, error: err.message });
        fallbackOccurred = true;

        // Record failure and classify cooldown
        await this.handleProviderFailure(cfg.provider, err);

        // Check if admin has disabled automatic fallback
        const isFallbackAllowed = await this.isFallbackEnabled();
        if (!isFallbackAllowed) {
          throw new InternalServerErrorException(
            `Primary provider ${cfg.provider} failed and automatic fallback is disabled by administrator: ${err.message}`,
          );
        }

        // Otherwise, continue to next provider in fallback chain
      }
    }

    // All configured providers exhausted or failed
    this.logger.error(`All AI providers failed. Attempts: ${JSON.stringify(attempts)}`);
    return {
      result: this.generateEmergencyFallbackResponse(messages, attempts),
      fallbackOccurred: true,
      attempts,
    };
  }

  /**
   * Executes provider generation with a single exponential-backoff retry on 5xx or timeout.
   */
  private async executeProviderWithRetry(
    provider: AiProvider,
    messages: AiMessageInput[],
    options: AiGenerateOptions,
  ): Promise<AiGenerateResult> {
    try {
      return await provider.generate(messages, options);
    } catch (err: any) {
      if (err instanceof AiServerError && err.isRetryable) {
        this.logger.warn(`Temporary server error from ${provider.name}. Retrying in 600ms...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        return await provider.generate(messages, options);
      }
      throw err;
    }
  }

  /**
   * Records a successful provider request and resets error counters.
   */
  private async recordProviderSuccess(providerName: string) {
    try {
      await this.prisma.aIProviderHealth.upsert({
        where: { provider: providerName },
        update: {
          totalRequests: { increment: 1 },
          successfulRequests: { increment: 1 },
          consecutiveErrors: 0,
          isHealthy: true,
          lastSuccessAt: new Date(),
          cooldownUntil: null,
        },
        create: {
          provider: providerName,
          totalRequests: 1,
          successfulRequests: 1,
          consecutiveErrors: 0,
          isHealthy: true,
          lastSuccessAt: new Date(),
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to update AIProviderHealth success: ${e.message}`);
    }
  }

  /**
   * Handles failure by classifying errors and setting cooldowns.
   */
  private async handleProviderFailure(providerName: string, error: any) {
    try {
      let cooldownMinutes = 0;

      if (error instanceof AiRateLimitError || error instanceof AiQuotaError) {
        cooldownMinutes = 5; // 5-minute cooldown on rate limits / quota exhaustion
      } else if (error instanceof AiAuthError) {
        cooldownMinutes = 15; // 15-minute cooldown on authentication/key failure
      } else if (error instanceof AiServerError) {
        cooldownMinutes = 2; // 2-minute cooldown on service outages
      } else {
        cooldownMinutes = 1;
      }

      const cooldownUntil = new Date(Date.now() + cooldownMinutes * 60 * 1000);

      await this.prisma.aIProviderHealth.upsert({
        where: { provider: providerName },
        update: {
          totalRequests: { increment: 1 },
          failedRequests: { increment: 1 },
          consecutiveErrors: { increment: 1 },
          isHealthy: false,
          lastFailureAt: new Date(),
          lastErrorMessage: error.message,
          cooldownUntil,
        },
        create: {
          provider: providerName,
          totalRequests: 1,
          failedRequests: 1,
          consecutiveErrors: 1,
          isHealthy: false,
          lastFailureAt: new Date(),
          lastErrorMessage: error.message,
          cooldownUntil,
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to update AIProviderHealth failure: ${e.message}`);
    }
  }

  /**
   * Retrieves effective ordered provider configuration from database or defaults.
   */
  async getEffectiveProviderChain() {
    let configs = await this.prisma.aIProviderConfiguration.findMany({
      orderBy: [{ isPreferred: 'desc' }, { priority: 'asc' }],
    });

    if (!configs || configs.length === 0) {
      // Initialize in database if missing
      await this.restoreDefaultProviderOrder();
      configs = await this.prisma.aIProviderConfiguration.findMany({
        orderBy: [{ isPreferred: 'desc' }, { priority: 'asc' }],
      });
    }

    return configs;
  }

  /**
   * Checks whether automatic fallback is enabled in PlatformConfig.
   */
  async isFallbackEnabled(): Promise<boolean> {
    const config = await this.prisma.platformConfig.findUnique({
      where: { key: 'AI_FALLBACK_ENABLED' },
    });
    if (!config || config.value === null || config.value === undefined) {
      return true; // Enabled by default
    }
    return Boolean(config.value);
  }

  /**
   * Updates automatic fallback toggle in PlatformConfig.
   */
  async setFallbackEnabled(enabled: boolean) {
    return this.prisma.platformConfig.upsert({
      where: { key: 'AI_FALLBACK_ENABLED' },
      update: { value: enabled },
      create: {
        category: 'AI',
        key: 'AI_FALLBACK_ENABLED',
        value: enabled,
      },
    });
  }

  /**
   * Restores standard default order: Gemini (1) -> DeepSeek (2) -> Groq (3).
   */
  async restoreDefaultProviderOrder() {
    const defaults = [
      {
        provider: 'GEMINI',
        name: 'Google Gemini',
        isEnabled: true,
        isPreferred: true,
        priority: 1,
        model: 'gemini-1.5-flash',
        timeoutMs: 30000,
        maxTokens: 2048,
        temperature: 0.7,
      },
      {
        provider: 'DEEPSEEK',
        name: 'DeepSeek',
        isEnabled: true,
        isPreferred: false,
        priority: 2,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        timeoutMs: 30000,
        maxTokens: 2048,
        temperature: 0.7,
      },
      {
        provider: 'GROQ',
        name: 'Groq',
        isEnabled: true,
        isPreferred: false,
        priority: 3,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        timeoutMs: 30000,
        maxTokens: 2048,
        temperature: 0.7,
      },
    ];

    for (const d of defaults) {
      await this.prisma.aIProviderConfiguration.upsert({
        where: { provider: d.provider },
        update: {
          name: d.name,
          isEnabled: d.isEnabled,
          isPreferred: d.isPreferred,
          priority: d.priority,
          model: d.model,
          timeoutMs: d.timeoutMs,
          maxTokens: d.maxTokens,
          temperature: d.temperature,
        },
        create: d,
      });

      await this.prisma.aIProviderHealth.upsert({
        where: { provider: d.provider },
        update: {},
        create: {
          provider: d.provider,
          isHealthy: true,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          consecutiveErrors: 0,
        },
      });
    }

    await this.setFallbackEnabled(true);
  }

  /**
   * Retrieves full admin provider overview with health, latency and stats.
   */
  async getProviderStatusOverview(): Promise<{
    providers: ProviderStatusInfo[];
    fallbackEnabled: boolean;
    totalAiRequests: number;
    successfulAiRequests: number;
    failedAiRequests: number;
  }> {
    const configs: AIProviderConfiguration[] = await this.getEffectiveProviderChain();
    const healthRecords: AIProviderHealth[] = await this.prisma.aIProviderHealth.findMany();
    const fallbackEnabled = await this.isFallbackEnabled();

    const healthMap = new Map<string, AIProviderHealth>(healthRecords.map((h) => [h.provider, h]));

    let totalAiRequests = 0;
    let successfulAiRequests = 0;
    let failedAiRequests = 0;

    const providers: ProviderStatusInfo[] = configs.map((cfg) => {
      const providerInstance = this.providers.get(cfg.provider as AiProviderName);
      const health = healthMap.get(cfg.provider);

      const inCooldown = !!(health?.cooldownUntil && new Date() < health.cooldownUntil);

      totalAiRequests += health?.totalRequests || 0;
      successfulAiRequests += health?.successfulRequests || 0;
      failedAiRequests += health?.failedRequests || 0;

      return {
        provider: cfg.provider as AiProviderName,
        name: cfg.name,
        isEnabled: cfg.isEnabled,
        isPreferred: cfg.isPreferred,
        priority: cfg.priority,
        model: cfg.model,
        isConfigured: providerInstance ? providerInstance.isConfigured() : false,
        isHealthy: health?.isHealthy ?? true,
        inCooldown,
        cooldownUntil: health?.cooldownUntil || null,
        totalRequests: health?.totalRequests || 0,
        successfulRequests: health?.successfulRequests || 0,
        failedRequests: health?.failedRequests || 0,
        lastSuccessAt: health?.lastSuccessAt || null,
        lastFailureAt: health?.lastFailureAt || null,
        lastErrorMessage: health?.lastErrorMessage || null,
      };
    });

    return {
      providers,
      fallbackEnabled,
      totalAiRequests,
      successfulAiRequests,
      failedAiRequests,
    };
  }

  /**
   * Tests a specific provider connection.
   */
  async testProvider(providerName: AiProviderName): Promise<AiTestResult> {
    const providerInstance = this.providers.get(providerName);
    if (!providerInstance) {
      return {
        success: false,
        provider: providerName,
        model: 'unknown',
        latencyMs: 0,
        message: `Provider '${providerName}' is not registered.`,
      };
    }

    const cfg = await this.prisma.aIProviderConfiguration.findUnique({
      where: { provider: providerName },
    });

    const result = await providerInstance.testConnection(cfg?.model);

    // Update health table based on test result
    if (result.success) {
      await this.recordProviderSuccess(providerName);
    } else {
      await this.handleProviderFailure(providerName, new Error(result.message || 'Test failed'));
    }

    return result;
  }

  /**
   * Updates provider configuration.
   */
  async updateProviderConfiguration(
    providerName: AiProviderName,
    updates: {
      isEnabled?: boolean;
      isPreferred?: boolean;
      priority?: number;
      model?: string;
      timeoutMs?: number;
      maxTokens?: number;
      temperature?: number;
    },
  ) {
    if (updates.isPreferred) {
      // Unmark any other preferred provider
      await this.prisma.aIProviderConfiguration.updateMany({
        where: { provider: { not: providerName } },
        data: { isPreferred: false },
      });
    }

    return this.prisma.aIProviderConfiguration.update({
      where: { provider: providerName },
      data: updates,
    });
  }

  /**
   * Generates a structured offline emergency response if all cloud providers are unreachable or unconfigured.
   */
  private generateEmergencyFallbackResponse(
    messages: AiMessageInput[],
    attempts: Array<{ provider: string; error?: string }>,
  ): AiGenerateResult {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'your query';

    const providerSummary = attempts.map((a) => `• **${a.provider}**: ${a.error || 'Temporarily unreachable'}`).join('\n');

    return {
      content: `### ⚠️ AI Assistant Service Notice

Our primary and fallback cloud intelligence providers (Google Gemini, DeepSeek, and Groq) are currently in cooldown or awaiting administrator API key configuration on Render:

${providerSummary}

---

#### 💡 Guidance for: *"${lastUserMsg.slice(0, 100)}"*

While live cloud model generation reconnects, here are immediate next steps on the **EES (Evolve, Engage & Scale)** platform:

1. **Evolve (Skill Development)**: Browse your curated learning tracker in [/evolve](/evolve). Verify required milestones for your primary focus field.
2. **Engage (Community Discussions)**: Share your technical questions directly with peers and mentors on [/engage](/engage).
3. **Scale (Commercial Opportunities)**: Review verified Provolution Technologies projects in [/scale](/scale).

*Administrators can verify API credentials (\`GEMINI_API_KEY\`, \`DEEPSEEK_API_KEY\`, \`GROQ_API_KEY\`) and test provider health in the [Admin AI Controls](/admin/ai).*`,
      provider: 'GEMINI',
      model: 'ees-resilient-fallback',
      latencyMs: 15,
    };
  }
}

