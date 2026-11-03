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
export class GeminiProvider implements AiProvider {
  readonly name: AiProviderName = 'GEMINI';
  private readonly logger = new Logger(GeminiProvider.name);

  // Verified candidate models for Google Gemini
  private readonly verifiedCandidates = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash-8b',
  ];

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  }

  getDefaultModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  getEffectiveTokenLimit(_model: string, requestedTokens?: number): number {
    return Math.min(requestedTokens ?? 2048, 8192);
  }

  async generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new AiAuthError(this.name, 'GEMINI_API_KEY environment variable is not configured');
    }

    const rawModel = options?.model || this.getDefaultModel();
    // Normalize model ID by stripping any leading 'models/' prefix
    const model = rawModel.replace(/^models\//, '').trim();
    const timeoutMs = options?.timeoutMs || 30000;
    const startTime = Date.now();

    try {
      return await this.executeGeneration(messages, model, apiKey, options, timeoutMs, startTime);
    } catch (err: any) {
      // If the configured model returned 404 (e.g. invalid 'gemini-2.5-flash-lite'), attempt automatic recovery with verified model
      if (err instanceof AiModelNotFoundError && model !== 'gemini-2.0-flash') {
        this.logger.warn(
          `Gemini model '${model}' returned 404. Attempting self-healing recovery with verified 'gemini-2.0-flash'...`,
        );
        try {
          return await this.executeGeneration(messages, 'gemini-2.0-flash', apiKey, options, timeoutMs, startTime);
        } catch (recoveryErr: any) {
          this.logger.error(`Self-healing recovery with 'gemini-2.0-flash' failed: ${recoveryErr.message}`);
        }
      }
      throw err;
    }
  }

  private async executeGeneration(
    messages: AiMessageInput[],
    model: string,
    apiKey: string,
    options: AiGenerateOptions | undefined,
    timeoutMs: number,
    startTime: number,
  ): Promise<AiGenerateResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Separate system messages from chat contents
    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: this.getEffectiveTokenLimit(model, options?.maxTokens),
      },
    };

    if (systemMessages.length > 0) {
      body.systemInstruction = {
        parts: systemMessages.map((m) => ({ text: m.content })),
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.log(`[GeminiProvider] Dispatched generation with model: '${model}', token budget: ${body.generationConfig.maxOutputTokens}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      const data: any = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error?.message || response.statusText || 'Gemini request failed';
        const status = response.status;

        if (status === 401) {
          throw new AiAuthError(this.name, `Gemini Authentication Error (401): ${errorMsg}`);
        }
        if (status === 403) {
          throw new AiForbiddenError(this.name, `Gemini Access Denied (403): ${errorMsg}`);
        }
        if (status === 404) {
          throw new AiModelNotFoundError(
            this.name,
            `Gemini Model '${model}' not found for API version v1beta or unsupported generateContent (404). Please discover or select a supported model.`,
          );
        }
        if (status === 429) {
          if (errorMsg.toLowerCase().includes('quota')) {
            throw new AiQuotaError(this.name, `Gemini Quota Exhausted: ${errorMsg}`);
          }
          throw new AiRateLimitError(this.name, `Gemini Rate Limit Exceeded: ${errorMsg}`);
        }
        if (status >= 500) {
          throw new AiServerError(this.name, status, `Gemini Server Outage (${status}): ${errorMsg}`);
        }
        throw new AiProviderError(`Gemini API Error (${status}): ${errorMsg}`, this.name, status);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || text.trim().length === 0) {
        throw new AiEmptyResponseError(this.name, 'Gemini returned an empty candidate response');
      }

      return {
        content: text.trim(),
        provider: this.name,
        model,
        promptTokens: data?.usageMetadata?.promptTokenCount,
        completionTokens: data?.usageMetadata?.candidatesTokenCount,
        totalTokens: data?.usageMetadata?.totalTokenCount,
        latencyMs,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new AiTimeoutError(this.name, `Gemini request timed out after ${timeoutMs}ms`);
      }
      if (err instanceof AiProviderError) {
        throw err;
      }
      throw new AiServerError(this.name, 500, `Gemini connection failed: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(
    model?: string,
    prompt = 'Reply with exactly: GEMINI_CONNECTION_SUCCESSFUL',
  ): Promise<AiTestResult> {
    const selectedModel = (model || this.getDefaultModel()).replace(/^models\//, '').trim();
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
        model: res.model || selectedModel,
        latencyMs: Date.now() - start,
        httpStatus: 200,
        errorCategory: null,
        responseContent: res.content,
        message: `Gemini verified successfully via model '${res.model || selectedModel}' in ${Date.now() - start}ms.`,
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
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      try {
        let allModels: any[] = [];
        let pageToken: string | undefined = undefined;
        let pageCount = 0;

        // Fetch models with pagination handling (up to 3 pages)
        do {
          const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
          const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}${pageParam}`;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);

          if (!response.ok) break;

          const data: any = await response.json();
          if (Array.isArray(data?.models)) {
            allModels = allModels.concat(data.models);
          }
          pageToken = data?.nextPageToken;
          pageCount++;
        } while (pageToken && pageCount < 3);

        if (allModels.length > 0) {
          const available = allModels
            .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => {
              const id = m.name.replace(/^models\//, '');
              const isCandidate = this.verifiedCandidates.includes(id);
              return {
                id,
                displayName: m.displayName || id,
                description: m.description || `Input limit: ${m.inputTokenLimit || 'N/A'} tokens`,
                contextWindow: m.inputTokenLimit,
                outputTokenLimit: m.outputTokenLimit || 8192,
                supportsGenerate: true,
                isRecommended: id === 'gemini-2.0-flash' || id === 'gemini-1.5-flash',
                isVerified: isCandidate,
              };
            });

          if (available.length > 0) {
            return available;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to dynamically discover Gemini models from API: ${err.message}. Using verified catalog fallback.`);
      }
    }

    // Verified catalog fallback if API key is not yet set or discovery query fails
    return [
      {
        id: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash (Recommended & Verified)',
        description: 'Next-gen multimodal, sub-second latency, high throughput (verified on v1beta)',
        contextWindow: 1048576,
        outputTokenLimit: 8192,
        supportsGenerate: true,
        isRecommended: true,
        isVerified: true,
      },
      {
        id: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash (Verified)',
        description: 'Fast, lightweight multimodal model for general conversational tasks',
        contextWindow: 1048576,
        outputTokenLimit: 8192,
        supportsGenerate: true,
        isRecommended: true,
        isVerified: true,
      },
      {
        id: 'gemini-2.0-flash-lite',
        displayName: 'Gemini 2.0 Flash-Lite (Verified)',
        description: 'Ultra cost-efficient lightweight 2.0 architecture',
        contextWindow: 1048576,
        outputTokenLimit: 8192,
        supportsGenerate: true,
        isRecommended: false,
        isVerified: true,
      },
      {
        id: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro (Verified)',
        description: 'Mid-size multimodal model optimized for complex reasoning and deep context',
        contextWindow: 2097152,
        outputTokenLimit: 8192,
        supportsGenerate: true,
        isRecommended: false,
        isVerified: true,
      },
      {
        id: 'gemini-1.5-flash-8b',
        displayName: 'Gemini 1.5 Flash-8B (Verified)',
        description: 'High volume, cost-efficient smaller model for speed and high QPS',
        contextWindow: 1048576,
        outputTokenLimit: 8192,
        supportsGenerate: true,
        isRecommended: false,
        isVerified: true,
      },
    ];
  }
}
