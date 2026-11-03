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
  AiRateLimitError,
  AiQuotaError,
  AiServerError,
  AiTimeoutError,
  AiEmptyResponseError,
  AiProviderError,
} from './ai-provider.interface';

@Injectable()
export class GroqProvider implements AiProvider {
  readonly name: AiProviderName = 'GROQ';
  private readonly logger = new Logger(GroqProvider.name);

  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0;
  }

  getDefaultModel(): string {
    return process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  }

  async generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new AiAuthError(this.name, 'GROQ_API_KEY environment variable is not configured');
    }

    const model = (options?.model || this.getDefaultModel()).trim();
    const timeoutMs = options?.timeoutMs || 30000;
    const url = 'https://api.groq.com/openai/v1/chat/completions';

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
        const errorMsg = data?.error?.message || response.statusText || 'Groq request failed';
        const status = response.status;

        if (status === 401) {
          throw new AiAuthError(this.name, `Groq Authentication Error (401): ${errorMsg}`);
        }
        if (status === 403) {
          throw new AiForbiddenError(this.name, `Groq Access Denied (403): ${errorMsg}`);
        }
        if (status === 404) {
          throw new AiModelNotFoundError(
            this.name,
            `Groq Model '${model}' not found or account lacks access (404). Please discover or select a supported model.`,
          );
        }
        if (status === 429) {
          if (errorMsg.toLowerCase().includes('quota')) {
            throw new AiQuotaError(this.name, `Groq Quota Exhausted: ${errorMsg}`);
          }
          throw new AiRateLimitError(this.name, `Groq Rate Limit Exceeded: ${errorMsg}`);
        }
        if (status >= 500) {
          throw new AiServerError(this.name, status, `Groq Server Error (${status}): ${errorMsg}`);
        }
        throw new AiProviderError(`Groq API Error (${status}): ${errorMsg}`, this.name, status);
      }

      const text = data?.choices?.[0]?.message?.content;
      if (!text || text.trim().length === 0) {
        throw new AiEmptyResponseError(this.name, 'Groq returned an empty response choice');
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
        throw new AiTimeoutError(this.name, `Groq request timed out after ${timeoutMs}ms`);
      }
      if (err instanceof AiProviderError) {
        throw err;
      }
      throw new AiServerError(this.name, 500, `Groq connection failed: ${err.message}`);
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
        message: `Groq verified successfully via model '${selectedModel}' in ${Date.now() - start}ms.`,
      };
    } catch (err: any) {
      const status = err.statusCode || (err instanceof AiAuthError ? 401 : err instanceof AiModelNotFoundError ? 404 : 500);
      const category = err.category || (err instanceof AiAuthError ? 'AUTHENTICATION_FAILURE' : err instanceof AiModelNotFoundError ? 'MODEL_NOT_FOUND' : 'SERVER_OUTAGE');

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
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (apiKey) {
      try {
        const url = 'https://api.groq.com/openai/v1/models';
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
            const available = data.data
              .filter((m: any) => m.active !== false && !m.id.includes('whisper'))
              .map((m: any) => ({
                id: m.id,
                displayName: m.id,
                description: `Context: ${m.context_window ? `${m.context_window} tokens` : 'Standard'} (Owned by: ${m.owned_by || 'Groq'})`,
                contextWindow: m.context_window,
                supportsGenerate: true,
                isRecommended: m.id === 'llama-3.1-8b-instant' || m.id === 'llama-3.3-70b-versatile',
              }));

            if (available.length > 0) {
              return available;
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to dynamically discover Groq models from API: ${err.message}. Using verified catalog fallback.`);
      }
    }

    // Verified catalog fallback if API key is not yet set or query fails
    return [
      {
        id: 'llama-3.1-8b-instant',
        displayName: 'Llama 3.1 8B Instant (Recommended)',
        description: 'Ultra fast sub-second inference, standard availability across all accounts',
        contextWindow: 131072,
        supportsGenerate: true,
        isRecommended: true,
      },
      {
        id: 'llama-3.3-70b-versatile',
        displayName: 'Llama 3.3 70B Versatile',
        description: 'State of the art 70B parameter model for complex logic and tool calling',
        contextWindow: 131072,
        supportsGenerate: true,
        isRecommended: true,
      },
      {
        id: 'llama3-70b-8192',
        displayName: 'Llama 3 70B (8192)',
        description: 'High performance Meta Llama 3 70B instruction-tuned model',
        contextWindow: 8192,
        supportsGenerate: true,
        isRecommended: false,
      },
      {
        id: 'llama3-8b-8192',
        displayName: 'Llama 3 8B (8192)',
        description: 'Standard 8B instruction tuned lightweight fast model',
        contextWindow: 8192,
        supportsGenerate: true,
        isRecommended: false,
      },
      {
        id: 'mixtral-8x7b-32768',
        displayName: 'Mixtral 8x7B (32768)',
        description: 'Mistral AI mixture of experts architecture with 32k context',
        contextWindow: 32768,
        supportsGenerate: true,
        isRecommended: false,
      },
      {
        id: 'gemma2-9b-it',
        displayName: 'Gemma 2 9B IT',
        description: 'Google Gemma 2 9B instruction-tuned model hosted on Groq LPU',
        contextWindow: 8192,
        supportsGenerate: true,
        isRecommended: false,
      },
    ];
  }
}


