import { Injectable, Logger } from '@nestjs/common';
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

  async generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult> {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) {
      throw new AiAuthError(this.name, 'DEEPSEEK_API_KEY environment variable is not configured');
    }

    const model = options?.model || this.getDefaultModel();
    const timeoutMs = options?.timeoutMs || 30000;
    const url = 'https://api.deepseek.com/chat/completions';

    const body: any = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
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

        if (status === 401 || status === 403) {
          throw new AiAuthError(this.name, `DeepSeek Authentication Error: ${errorMsg}`);
        }
        if (status === 429) {
          if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('balance')) {
            throw new AiQuotaError(this.name, `DeepSeek Quota Exhausted: ${errorMsg}`);
          }
          throw new AiRateLimitError(this.name, `DeepSeek Rate Limit Exceeded: ${errorMsg}`);
        }
        if (status >= 500) {
          throw new AiServerError(this.name, status, `DeepSeek Server Error: ${errorMsg}`);
        }
        throw new AiProviderError(`DeepSeek API Error (${status}): ${errorMsg}`, this.name, status);
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
        throw new AiServerError(this.name, 408, `DeepSeek request timed out after ${timeoutMs}ms`);
      }
      if (err instanceof AiProviderError) {
        throw err;
      }
      throw new AiServerError(this.name, 500, `DeepSeek connection failed: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(model?: string): Promise<AiTestResult> {
    const selectedModel = model || this.getDefaultModel();
    const start = Date.now();
    try {
      await this.generate([{ role: 'user', content: 'Ping. Respond with one word: OK' }], {
        model: selectedModel,
        timeoutMs: 10000,
        maxTokens: 10,
      });
      return {
        success: true,
        provider: this.name,
        model: selectedModel,
        latencyMs: Date.now() - start,
        message: 'DeepSeek API is reachable and responding normally.',
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        model: selectedModel,
        latencyMs: Date.now() - start,
        message: err.message,
      };
    }
  }
}
