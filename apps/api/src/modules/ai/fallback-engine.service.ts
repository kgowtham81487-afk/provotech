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
  DiscoveredModel,
  AiErrorCategory,
  ProviderHealthState,
  AiAuthError,
  AiForbiddenError,
  AiModelNotFoundError,
  AiInvalidConfigurationError,
  AiInsufficientBalanceError,
  AiRateLimitError,
  AiQuotaError,
  AiServerError,
  AiTimeoutError,
  AiEmptyResponseError,
  AiProviderError,
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
  healthState: ProviderHealthState;
  inCooldown: boolean;
  cooldownUntil: Date | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastErrorMessage: string | null;
  errorCategory?: string | null;
  effectiveTokenLimit?: number;
  isModelVerified?: boolean;
  discoveredModels?: DiscoveredModel[];
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
   * Computes the precise health state according to EES specifications.
   */
  computeHealthState(
    isEnabled: boolean,
    isConfigured: boolean,
    health: AIProviderHealth | null | undefined,
  ): ProviderHealthState {
    if (!isEnabled) {
      return 'DISABLED';
    }
    if (!isConfigured) {
      return 'AWAITING_API_KEY';
    }
    if (health?.cooldownUntil && new Date(health.cooldownUntil).getTime() > Date.now()) {
      return 'COOLDOWN';
    }
    const lastErr = health?.lastErrorMessage || '';
    if (lastErr.includes('[INSUFFICIENT_BALANCE]')) {
      return 'INSUFFICIENT_BALANCE';
    }
    if (lastErr.includes('[MODEL_NOT_FOUND]') || lastErr.includes('[INVALID_CONFIGURATION]')) {
      return 'INVALID_CONFIGURATION';
    }
    if (health && !health.isHealthy) {
      return 'DEGRADED';
    }
    if (health && health.isHealthy && (health.successfulRequests > 0 || health.lastSuccessAt)) {
      return 'HEALTHY';
    }
    return 'ACTIVE';
  }

  /**
   * Calculates bounded exponential backoff cooldown with jitter.
   * Policy: 1st=30s, 2nd=60s, 3rd=120s, 4th=240s, max=15m (900s).
   * Respects provider Retry-After header and adds random jitter.
   */
  calculateCooldownSeconds(consecutiveFailures: number, retryAfterSeconds?: number): number {
    const baseSeconds = 30;
    const maxCooldownSeconds = 900; // 15 minutes max

    const factor = Math.pow(2, Math.max(0, consecutiveFailures - 1));
    let cooldown = baseSeconds * factor;

    if (retryAfterSeconds && retryAfterSeconds > 0) {
      cooldown = Math.max(cooldown, retryAfterSeconds);
    }

    cooldown = Math.min(cooldown, maxCooldownSeconds);

    // Add 1 to 5 seconds of jitter to prevent simultaneous retry spikes across backend instances
    const jitter = Math.floor(Math.random() * 5);
    return cooldown + jitter;
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

      // Check temporary cooldown or permanent configuration failure
      const health = await this.prisma.aIProviderHealth.findUnique({
        where: { provider: cfg.provider },
      });

      const now = Date.now();

      // Check active cooldown status using exact numerical UTC comparison
      if (health?.cooldownUntil) {
        const cooldownTime = new Date(health.cooldownUntil).getTime();
        if (now < cooldownTime) {
          const remainingSecs = Math.ceil((cooldownTime - now) / 1000);
          this.logger.warn(
            `Provider ${cfg.provider} is in cooldown for another ${remainingSecs}s (until ${new Date(cooldownTime).toISOString()})`,
          );
          attempts.push({
            provider: cfg.provider,
            error: `In cooldown until ${new Date(cooldownTime).toISOString()} (${remainingSecs}s remaining)`,
          });
          fallbackOccurred = true;
          continue;
        } else {
          // Cooldown has expired! Clear cooldown in DB and make provider eligible for requests
          this.logger.log(`Cooldown expired for ${cfg.provider}. Auto-recovering provider eligibility.`);
          await this.prisma.aIProviderHealth.update({
            where: { provider: cfg.provider },
            data: { cooldownUntil: null },
          });
        }
      }

      // Check for permanent configuration/billing errors that require administrator resolution
      if (
        health &&
        !health.isHealthy &&
        !health.cooldownUntil &&
        health.lastErrorMessage &&
        (health.lastErrorMessage.includes('[INSUFFICIENT_BALANCE]') ||
          health.lastErrorMessage.includes('[MODEL_NOT_FOUND]') ||
          health.lastErrorMessage.includes('[INVALID_CONFIGURATION]') ||
          health.lastErrorMessage.includes('[AUTHENTICATION_FAILURE]') ||
          health.lastErrorMessage.includes('[PERMISSION_DENIED]'))
      ) {
        this.logger.warn(
          `Provider ${cfg.provider} skipped due to unresolved configuration/billing error: ${health.lastErrorMessage}`,
        );
        attempts.push({ provider: cfg.provider, error: health.lastErrorMessage });
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

        // If the provider self-healed to a verified model (e.g. Gemini healed to 3-flash-preview from invalid 404), update DB
        if (result.model && result.model !== cfg.model) {
          this.logger.log(`Auto-healed model detected: updating DB config for ${cfg.provider} to '${result.model}'`);
          await this.prisma.aIProviderConfiguration.update({
            where: { provider: cfg.provider },
            data: { model: result.model },
          });
        }

        return {
          result,
          fallbackOccurred: i > 0 || fallbackOccurred,
          attempts,
        };
      } catch (err: any) {
        this.logger.error(`Provider ${cfg.provider} generation failed: ${err.message}`);
        attempts.push({ provider: cfg.provider, error: err.message });
        fallbackOccurred = true;

        // Record failure, increment consecutive errors, and classify cooldown
        await this.handleProviderFailure(cfg.provider, err, undefined, err.statusCode, err.retryAfterSeconds);

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
   * Records a successful provider request, resets consecutive failure counters, and marks HEALTHY.
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
          lastErrorMessage: null,
          cooldownUntil: null,
        },
        create: {
          provider: providerName,
          totalRequests: 1,
          successfulRequests: 1,
          consecutiveErrors: 0,
          isHealthy: true,
          lastSuccessAt: new Date(),
          cooldownUntil: null,
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to update AIProviderHealth success: ${e.message}`);
    }
  }

  /**
   * Handles failure by classifying errors, applying bounded exponential backoff for transient issues,
   * and setting zero cooldown for permanent configuration/billing problems.
   */
  async handleProviderFailure(
    providerName: string,
    error: any,
    explicitCategory?: AiErrorCategory,
    httpStatus?: number,
    retryAfterSeconds?: number,
  ) {
    try {
      let category: AiErrorCategory = explicitCategory || 'PROVIDER_ERROR';

      if (!explicitCategory) {
        if (
          error instanceof AiInsufficientBalanceError ||
          httpStatus === 402 ||
          error?.message?.includes('402') ||
          error?.message?.toLowerCase().includes('insufficient balance')
        ) {
          category = 'INSUFFICIENT_BALANCE';
        } else if (
          error instanceof AiModelNotFoundError ||
          httpStatus === 404 ||
          error?.message?.includes('404') ||
          error?.message?.toLowerCase().includes('not found')
        ) {
          category = 'MODEL_NOT_FOUND';
        } else if (
          error instanceof AiInvalidConfigurationError ||
          httpStatus === 400 ||
          error?.message?.includes('400') ||
          error?.message?.toLowerCase().includes('max_tokens') ||
          error?.message?.toLowerCase().includes('invalid')
        ) {
          category = 'INVALID_CONFIGURATION';
        } else if (error instanceof AiAuthError || httpStatus === 401 || error?.message?.includes('401')) {
          category = 'AUTHENTICATION_FAILURE';
        } else if (error instanceof AiForbiddenError || httpStatus === 403 || error?.message?.includes('403')) {
          category = 'PERMISSION_DENIED';
        } else if (error instanceof AiQuotaError || error?.message?.toLowerCase().includes('quota')) {
          category = 'QUOTA_EXHAUSTED';
        } else if (error instanceof AiRateLimitError || httpStatus === 429 || error?.message?.includes('429')) {
          category = 'RATE_LIMITED';
        } else if (
          error instanceof AiTimeoutError ||
          httpStatus === 408 ||
          error?.message?.toLowerCase().includes('timeout')
        ) {
          category = 'TIMEOUT';
        } else if (error instanceof AiServerError || (httpStatus && httpStatus >= 500 && httpStatus < 600)) {
          category = 'SERVER_OUTAGE';
        } else if (error instanceof AiEmptyResponseError || httpStatus === 502) {
          category = 'EMPTY_RESPONSE';
        }
      }

      // Read current consecutive errors from database to compute bounded exponential backoff
      const currentHealth = await this.prisma.aIProviderHealth.findUnique({
        where: { provider: providerName },
      });
      const consecutiveFailures = (currentHealth?.consecutiveErrors || 0) + 1;

      let cooldownUntil: Date | null = null;

      // Determine cooldown behavior based on failure category
      switch (category) {
        case 'INSUFFICIENT_BALANCE':
        case 'MODEL_NOT_FOUND':
        case 'INVALID_CONFIGURATION':
        case 'AUTHENTICATION_FAILURE':
        case 'PERMISSION_DENIED':
          // Permanent configuration/billing errors MUST NOT trigger cooldown loops!
          cooldownUntil = null;
          break;
        case 'RATE_LIMITED':
        case 'QUOTA_EXHAUSTED':
        case 'SERVER_OUTAGE':
        case 'TIMEOUT':
        case 'EMPTY_RESPONSE':
        case 'NETWORK_ERROR':
        default: {
          // Recoverable transient failure: apply bounded exponential backoff with jitter
          const cooldownSecs = this.calculateCooldownSeconds(consecutiveFailures, retryAfterSeconds);
          cooldownUntil = new Date(Date.now() + cooldownSecs * 1000);
          this.logger.warn(
            `Transient failure #${consecutiveFailures} for ${providerName}. Applied bounded backoff cooldown of ${cooldownSecs}s (until ${cooldownUntil.toISOString()}).`,
          );
          break;
        }
      }

      const formattedErrorMessage = `[${category}] ${error.message || 'Unknown error'}`;

      await this.prisma.aIProviderHealth.upsert({
        where: { provider: providerName },
        update: {
          totalRequests: { increment: 1 },
          failedRequests: { increment: 1 },
          consecutiveErrors: { increment: 1 },
          isHealthy: false,
          lastFailureAt: new Date(),
          lastErrorMessage: formattedErrorMessage,
          cooldownUntil,
        },
        create: {
          provider: providerName,
          totalRequests: 1,
          failedRequests: 1,
          consecutiveErrors: 1,
          isHealthy: false,
          lastFailureAt: new Date(),
          lastErrorMessage: formattedErrorMessage,
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
      return true;
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
   * Restores standard default order: Gemini (1) -> DeepSeek (2) -> Groq (3) with verified models.
   */
  async restoreDefaultProviderOrder() {
    const defaults = [
      {
        provider: 'GEMINI',
        name: 'Google Gemini',
        isEnabled: true,
        isPreferred: true,
        priority: 1,
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        timeoutMs: 30000,
        maxTokens: 2048,
        temperature: 0.7,
        metadata: { isModelVerified: true, verifiedModel: 'gemini-3-flash-preview' },
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
        metadata: { isModelVerified: true, verifiedModel: 'deepseek-chat' },
      },
      {
        provider: 'GROQ',
        name: 'Groq',
        isEnabled: true,
        isPreferred: false,
        priority: 3,
        model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
        timeoutMs: 30000,
        maxTokens: 2048,
        temperature: 0.7,
        metadata: { isModelVerified: true, verifiedModel: 'qwen/qwen3.8-27b' },
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
          metadata: d.metadata,
        },
        create: d,
      });

      await this.prisma.aIProviderHealth.upsert({
        where: { provider: d.provider },
        update: {
          cooldownUntil: null,
          consecutiveErrors: 0,
        },
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
   * Resets cooldown timer for a provider.
   * NOTE: This does NOT falsely mark the provider as HEALTHY; it only removes the cooldown restriction
   * and resets consecutive errors so the provider is immediately eligible for a fresh test/request.
   */
  async resetCooldown(providerName: AiProviderName) {
    return this.prisma.aIProviderHealth.upsert({
      where: { provider: providerName },
      update: {
        cooldownUntil: null,
        consecutiveErrors: 0,
      },
      create: {
        provider: providerName,
        isHealthy: false,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        consecutiveErrors: 0,
        cooldownUntil: null,
      },
    });
  }

  /**
   * Clears cooldown and executes an immediate real generation test on the provider.
   * Marks HEALTHY only if the generation test succeeds.
   */
  async retryProvider(providerName: AiProviderName): Promise<AiTestResult> {
    await this.resetCooldown(providerName);
    return this.testProvider(providerName);
  }

  /**
   * Discovers available models for a given provider via its live API.
   * Caches results in AIProviderConfiguration.metadata.
   */
  async discoverModels(providerName: AiProviderName): Promise<DiscoveredModel[]> {
    const providerInstance = this.providers.get(providerName);
    if (!providerInstance) {
      return [];
    }

    const models = await providerInstance.discoverModels();

    try {
      const existing = await this.prisma.aIProviderConfiguration.findUnique({
        where: { provider: providerName },
      });
      const currentMeta = (existing?.metadata as any) || {};

      await this.prisma.aIProviderConfiguration.update({
        where: { provider: providerName },
        data: {
          metadata: {
            ...currentMeta,
            discoveredModels: models,
            modelsDiscoveredAt: new Date().toISOString(),
          },
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist discovered models in DB for ${providerName}: ${err.message}`);
    }

    return models;
  }

  /**
   * Verifies an actual generation request against a specific candidate model.
   * Persists verification state upon success.
   */
  async verifyModel(providerName: AiProviderName, model: string): Promise<AiTestResult> {
    const prompt =
      providerName === 'GEMINI'
        ? 'Reply with exactly: GEMINI_CONNECTION_SUCCESSFUL'
        : 'Reply with exactly: EES AI connection successful.';

    const result = await this.testProvider(providerName, model, prompt);

    if (result.success) {
      try {
        const existing = await this.prisma.aIProviderConfiguration.findUnique({
          where: { provider: providerName },
        });
        const currentMeta = (existing?.metadata as any) || {};

        await this.prisma.aIProviderConfiguration.update({
          where: { provider: providerName },
          data: {
            model,
            metadata: {
              ...currentMeta,
              isModelVerified: true,
              verifiedModel: model,
              verifiedAt: new Date().toISOString(),
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to update verified model metadata: ${err.message}`);
      }
    }

    return result;
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

      const isConfigured = providerInstance ? providerInstance.isConfigured() : false;
      const inCooldown = !!(health?.cooldownUntil && new Date(health.cooldownUntil).getTime() > Date.now());
      const healthState = this.computeHealthState(cfg.isEnabled, isConfigured, health);

      totalAiRequests += health?.totalRequests || 0;
      successfulAiRequests += health?.successfulRequests || 0;
      failedAiRequests += health?.failedRequests || 0;

      let errorCategory: string | null = null;
      if (health?.lastErrorMessage) {
        const match = health.lastErrorMessage.match(/^\[([A-Z_]+)\]/);
        if (match) {
          errorCategory = match[1];
        }
      }

      const meta = (cfg.metadata as any) || {};
      const discoveredModels: DiscoveredModel[] = meta.discoveredModels || [];
      const isModelVerified = !!meta.isModelVerified;
      const effectiveTokenLimit = providerInstance?.getEffectiveTokenLimit
        ? providerInstance.getEffectiveTokenLimit(cfg.model, cfg.maxTokens)
        : cfg.maxTokens;

      return {
        provider: cfg.provider as AiProviderName,
        name: cfg.name,
        isEnabled: cfg.isEnabled,
        isPreferred: cfg.isPreferred,
        priority: cfg.priority,
        model: cfg.model,
        isConfigured,
        isHealthy: health?.isHealthy ?? true,
        healthState,
        inCooldown,
        cooldownUntil: health?.cooldownUntil || null,
        totalRequests: health?.totalRequests || 0,
        successfulRequests: health?.successfulRequests || 0,
        failedRequests: health?.failedRequests || 0,
        lastSuccessAt: health?.lastSuccessAt || null,
        lastFailureAt: health?.lastFailureAt || null,
        lastErrorMessage: health?.lastErrorMessage || null,
        errorCategory,
        effectiveTokenLimit,
        isModelVerified,
        discoveredModels,
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
   * Tests a specific provider connection with specified model and prompt.
   * Marks HEALTHY only if the generation test succeeds.
   */
  async testProvider(
    providerName: AiProviderName,
    model?: string,
    prompt?: string,
  ): Promise<AiTestResult> {
    const providerInstance = this.providers.get(providerName);
    if (!providerInstance) {
      return {
        success: false,
        provider: providerName,
        model: model || 'unknown',
        latencyMs: 0,
        httpStatus: 400,
        errorCategory: 'PROVIDER_ERROR',
        message: `Provider '${providerName}' is not registered.`,
      };
    }

    const cfg = await this.prisma.aIProviderConfiguration.findUnique({
      where: { provider: providerName },
    });

    const targetModel = model || cfg?.model;
    const testPrompt =
      prompt ||
      (providerName === 'GEMINI'
        ? 'Reply with exactly: GEMINI_CONNECTION_SUCCESSFUL'
        : 'Reply with exactly: EES AI connection successful.');

    const result = await providerInstance.testConnection(targetModel, testPrompt);

    // Update health table based on test result
    if (result.success) {
      await this.recordProviderSuccess(providerName);
      try {
        const currentMeta = (cfg?.metadata as any) || {};
        await this.prisma.aIProviderConfiguration.update({
          where: { provider: providerName },
          data: {
            metadata: {
              ...currentMeta,
              isModelVerified: true,
              verifiedModel: result.model || targetModel,
              verifiedAt: new Date().toISOString(),
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to update test verification meta: ${err.message}`);
      }
    } else {
      await this.handleProviderFailure(
        providerName,
        new Error(result.message || 'Test failed'),
        result.errorCategory || undefined,
        result.httpStatus,
      );
    }

    return result;
  }

  /**
   * Updates provider configuration.
   * Invalidates stale health records, clears obsolete cooldown, and retests the new configuration.
   * Marks HEALTHY only after actual generation succeeds.
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
    autoTest = true,
  ) {
    if (updates.isPreferred) {
      await this.prisma.aIProviderConfiguration.updateMany({
        where: { provider: { not: providerName } },
        data: { isPreferred: false },
      });
    }

    const updatedConfig = await this.prisma.aIProviderConfiguration.update({
      where: { provider: providerName },
      data: updates,
    });

    // Invalidate stale health info and clear obsolete cooldown when model or parameters change
    if (updates.model || updates.maxTokens !== undefined || updates.timeoutMs !== undefined) {
      await this.prisma.aIProviderHealth.upsert({
        where: { provider: providerName },
        update: {
          cooldownUntil: null,
          consecutiveErrors: 0,
          lastErrorMessage: null,
          // Do not mark healthy until actual test succeeds!
        },
        create: {
          provider: providerName,
          isHealthy: false,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          consecutiveErrors: 0,
          cooldownUntil: null,
        },
      });

      // Retest the new configuration if requested
      if (autoTest) {
        const testRes = await this.testProvider(providerName, updates.model);
        this.logger.log(
          `Auto-tested updated configuration for ${providerName}: success=${testRes.success}, status=${testRes.httpStatus}`,
        );
      }
    }

    return updatedConfig;
  }

  /**
   * Generates a context-aware structured offline emergency response if all cloud providers are unreachable,
   * distinguishing between temporary cooldown, missing billing, incorrect configuration, or disabled state.
   */
  private generateEmergencyFallbackResponse(
    messages: AiMessageInput[],
    attempts: Array<{ provider: string; error?: string }>,
  ): AiGenerateResult {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'your query';

    const hasDisabled = attempts.length > 0 && attempts.every((a) => a.error?.toLowerCase().includes('disabled'));
    const hasBilling = attempts.some(
      (a) => a.error?.includes('INSUFFICIENT_BALANCE') || a.error?.includes('AUTHENTICATION_FAILURE'),
    );
    const hasConfig = attempts.some(
      (a) => a.error?.includes('MODEL_NOT_FOUND') || a.error?.includes('INVALID_CONFIGURATION'),
    );
    const hasCooldown = attempts.some((a) => a.error?.toLowerCase().includes('cooldown'));

    let contextSummary = 'Our primary and fallback cloud intelligence providers are currently undergoing maintenance.';

    if (hasDisabled) {
      contextSummary = 'All AI intelligence providers are currently disabled by the administrator.';
    } else if (hasBilling) {
      contextSummary =
        'AI intelligence providers require account billing or credential resolution (e.g. DeepSeek credit top-up or API key configuration on Render).';
    } else if (hasConfig) {
      contextSummary =
        'AI intelligence providers require model or token configuration adjustment in Admin AI Controls.';
    } else if (hasCooldown) {
      contextSummary =
        'AI intelligence providers are experiencing high upstream traffic and are in a brief, bounded cooldown. They will automatically re-engage shortly.';
    }

    const providerSummary = attempts.map((a) => `• **${a.provider}**: ${a.error || 'Temporarily unreachable'}`).join('\n');

    return {
      content: `### ⚠️ AI Assistant Service Notice

${contextSummary}

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
