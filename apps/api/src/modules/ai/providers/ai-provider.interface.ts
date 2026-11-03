export type AiProviderName = 'GEMINI' | 'DEEPSEEK' | 'GROQ';

export interface AiMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AiGenerateResult {
  content: string;
  provider: AiProviderName;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
}

export interface AiTestResult {
  success: boolean;
  provider: AiProviderName;
  model: string;
  latencyMs: number;
  message?: string;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: AiProviderName,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = true,
    public readonly isQuota: boolean = false,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export class AiRateLimitError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Rate limit exceeded') {
    super(message, provider, 429, false, true);
    this.name = 'AiRateLimitError';
  }
}

export class AiQuotaError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Quota exhausted') {
    super(message, provider, 429, false, true);
    this.name = 'AiQuotaError';
  }
}

export class AiAuthError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Authentication failed / Invalid API key') {
    super(message, provider, 401, false, false);
    this.name = 'AiAuthError';
  }
}

export class AiServerError extends AiProviderError {
  constructor(provider: AiProviderName, statusCode = 500, message = 'Provider server error') {
    super(message, provider, statusCode, true, false);
    this.name = 'AiServerError';
  }
}

export class AiEmptyResponseError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Provider returned empty or malformed response') {
    super(message, provider, 502, true, false);
    this.name = 'AiEmptyResponseError';
  }
}

export interface AiProvider {
  readonly name: AiProviderName;
  isConfigured(): boolean;
  getDefaultModel(): string;
  generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult>;
  testConnection(model?: string): Promise<AiTestResult>;
}

