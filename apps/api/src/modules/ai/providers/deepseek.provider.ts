import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  AiProviderName,
  AiMessageInput,
  AiGenerateOptions,
  AiGenerateResult,
  AiTestResult,
  DiscoveredModel,
  AiAuthError,
  AiForbiddenError,
  AiModelNotFoundError,
  AiInsufficientBalanceError,
  AiRateLimitError,
  AiQuotaError,
  AiServerError,
  AiTimeoutError,
  AiEmptyResponseError,
  AiProviderError,
} from './ai-provider.interface';

@Injectable()
export class DeepSeekProvider implements AiProvider {
  readonly name: AiProviderName = 'DEEPSEEK';
  private readonly logger = new Logger(DeepSeekProvider.name);

  isConfigured(): boolean {
    return !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim().length > 0;
  }

  getDefaultModel(): string {
    return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  getEffectiveTokenLimit(_model: string, requestedTokens?: number): number {
    return Math.min(requestedTokens ?? 2048, 4096);
  }

  async generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) {
      throw new AiAuthError(this.name, 'DEEPSEEK_API_KEY environment variable is not configured');
    }

    const model = (options?.model || this.getDefaultModel()).trim();
    const timeoutMs = options?.timeoutMs || 30000;
    const url = 'https://api.deepseek.com/chat/completions';

    const body: any = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: this.getEffectiveTokenLimit(model, options?.maxTokens),
    };

    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      const data: any = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || response.statusText || 'DeepSeek request failed';
        const status = response.status;
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfterSeconds = retryAfterHeader && !isNaN(parseInt(retryAfterHeader, 10)) ? parseInt(retryAfterHeader, 10) : undefined;

        if (status === 401) {
          throw new AiAuthError(this.name, `DeepSeek Authentication Error (401): ${errorMsg}`);
        }
        if (status === 402) {
          throw new AiInsufficientBalanceError(
            this.name,
            `DeepSeek Insufficient Balance (402): Account balance is depleted. Please top up your DeepSeek platform balance.`,
          );
        }
        if (status === 403) {
          throw new AiForbiddenError(this.name, `DeepSeek Access Denied (403): ${errorMsg}`);
        }
        if (status === 404) {
          throw new AiModelNotFoundError(
            this.name,
            `DeepSeek Model '${model}' not found (404). Please verify model selection.`,
          );
        }
        if (status === 429) {
          if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('balance')) {
            throw new AiQuotaError(this.name, `DeepSeek Quota Exhausted: ${errorMsg}`, retryAfterSeconds);
          }
          throw new AiRateLimitError(this.name, `DeepSeek Rate Limit Exceeded: ${errorMsg}`, retryAfterSeconds);
        }
        if (status >= 500) {
          throw new AiServerError(this.name, status, `DeepSeek Server Error (${status}): ${errorMsg}`, retryAfterSeconds);
        }
        throw new AiProviderError(`DeepSeek API Error (${status}): ${errorMsg}`, this.name, status, true, false, 'SERVER_OUTAGE', retryAfterSeconds);
      }

      const text = data?.choices?.[0]?.message?.content;
      if (!text || text.trim().length === 0) {
        throw new AiEmptyResponseError(this.name, 'DeepSeek returned an empty response choice');
      }

      return {
        content: text.trim(),
        provider: this.name,
        model,
        promptTokens: data?.usage?.prompt_tokens,
        completionTokens: data?.usage?.completion_tokens,
        totalTokens: data?.usage?.total_tokens,
        latencyMs,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new AiTimeoutError(this.name, `DeepSeek request timed out after ${timeoutMs}ms`);
      }
      if (err instanceof AiProviderError) {
        throw err;
      }
      throw new AiServerError(this.name, 500, `DeepSeek connection failed: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(
    model?: string,
    prompt = 'Reply with exactly: EES AI connection successful.',
  ): Promise<AiTestResult> {
    const selectedModel = (model || this.getDefaultModel()).trim();
    const start = Date.now();
    try {
      const res = await this.generate([{ role: 'user', content: prompt }], {
        model: selectedModel,
        timeoutMs: 15000,
        maxTokens: 50,
        temperature: 0.1,
      });

      return {
        success: true,
        provider: this.name,
        model: selectedModel,
        latencyMs: Date.now() - start,
        httpStatus: 200,
        errorCategory: null,
        responseContent: res.content,
        message: `DeepSeek verified successfully via model '${selectedModel}' in ${Date.now() - start}ms.`,
      };
    } catch (err: any) {
      const status = err.statusCode || (err instanceof AiAuthError ? 401 : err instanceof AiInsufficientBalanceError ? 402 : err instanceof AiModelNotFoundError ? 404 : 500);
      const category = err.category || (err instanceof AiAuthError ? 'AUTHENTICATION_FAILURE' : err instanceof AiInsufficientBalanceError ? 'INSUFFICIENT_BALANCE' : err instanceof AiModelNotFoundError ? 'MODEL_NOT_FOUND' : 'SERVER_OUTAGE');

      return {
        success: false,
        provider: this.name,
        model: selectedModel,
        latencyMs: Date.now() - start,
        httpStatus: status,
        errorCategory: category,
        message: err.message,
      };
    }
  }

  async discoverModels(): Promise<DiscoveredModel[]> {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (apiKey) {
      try {
        const url = 'https://api.deepseek.com/models';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.ok) {
          const data: any = await response.json();
          if (Array.isArray(data?.data) && data.data.length > 0) {
            return data.data.map((m: any) => ({
              id: m.id,
              displayName: m.id,
              description: `DeepSeek official production model (${m.owned_by || 'deepseek'})`,
              contextWindow: 65536,
              outputTokenLimit: 4096,
              supportsGenerate: true,
              isRecommended: m.id === 'deepseek-chat',
              isVerified: true,
            }));
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to dynamically discover DeepSeek models from API: ${err.message}. Using verified catalog fallback.`);
      }
    }

    // Verified catalog fallback
    return [
      {
        id: 'deepseek-chat',
        displayName: 'DeepSeek-V3 (deepseek-chat) [Recommended]',
        description: 'General conversational chat, code generation, and function calling (64k context)',
        contextWindow: 65536,
        outputTokenLimit: 4096,
        supportsGenerate: true,
        isRecommended: true,
        isVerified: true,
      },
      {
        id: 'deepseek-reasoner',
        displayName: 'DeepSeek-R1 (deepseek-reasoner)',
        description: 'Chain-of-thought advanced reasoning model with deep mathematical analysis',
        contextWindow: 65536,
        outputTokenLimit: 4096,
        supportsGenerate: true,
        isRecommended: false,
        isVerified: true,
      },
    ];
  }
}
