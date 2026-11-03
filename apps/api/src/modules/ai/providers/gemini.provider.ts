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
  AiServerError,
  AiEmptyResponseError,
  AiProviderError,
} from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name: AiProviderName = 'GEMINI';
  private readonly logger = new Logger(GeminiProvider.name);

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  }

  getDefaultModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new AiAuthError(this.name, 'GEMINI_API_KEY environment variable is not configured');
    }

    const model = options?.model || this.getDefaultModel();
    const timeoutMs = options?.timeoutMs || 30000;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Separate system messages from chat contents
    const systemMessages = messages.filter((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // If chatMessages is empty, pass a default user greeting
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (systemMessages.length > 0) {
      body.systemInstruction = {
        parts: systemMessages.map((m) => ({ text: m.content })),
      };
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

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

        if (status === 401 || status === 403) {
          throw new AiAuthError(this.name, `Gemini Authentication Error: ${errorMsg}`);
        }
        if (status === 429) {
          throw new AiRateLimitError(this.name, `Gemini Rate Limit Exceeded: ${errorMsg}`);
        }
        if (status >= 500) {
          throw new AiServerError(this.name, status, `Gemini Server Outage: ${errorMsg}`);
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
        throw new AiServerError(this.name, 408, `Gemini request timed out after ${timeoutMs}ms`);
      }
      if (err instanceof AiProviderError) {
        throw err;
      }
      throw new AiServerError(this.name, 500, `Gemini connection failed: ${err.message}`);
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
        message: 'Google Gemini API is reachable and responding normally.',
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

