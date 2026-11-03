export type AiProviderName = 'GEMINI' | 'DEEPSEEK' | 'GROQ';

export type AiErrorCategory =
  | 'AUTHENTICATION_FAILURE' // 401
  | 'INSUFFICIENT_BALANCE'   // 402
  | 'PERMISSION_DENIED'       // 403
  | 'MODEL_NOT_FOUND'        // 404
  | 'INVALID_CONFIGURATION'  // 400
  | 'RATE_LIMITED'           // 429
  | 'QUOTA_EXHAUSTED'        // 429 quota
  | 'SERVER_OUTAGE'          // 5xx
  | 'TIMEOUT'                // 408 / Abort
  | 'EMPTY_RESPONSE'         // 502
  | 'NETWORK_ERROR'          // Connection refused, DNS
  | 'PROVIDER_ERROR'         // General provider failure
  | 'UNKNOWN_ERROR';

export type ProviderHealthState =
  | 'ACTIVE'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'COOLDOWN'
  | 'INVALID_CONFIGURATION'
  | 'INSUFFICIENT_BALANCE'
  | 'AWAITING_API_KEY'
  | 'DISABLED';

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
  httpStatus?: number;
  errorCategory?: AiErrorCategory | null;
  responseContent?: string;
}

export interface DiscoveredModel {
  id: string;
  displayName: string;
  description?: string;
  contextWindow?: number;
  outputTokenLimit?: number;
  supportsGenerate: boolean;
  isRecommended?: boolean;
  isVerified?: boolean;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: AiProviderName,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = true,
    public readonly isQuota: boolean = false,
    public readonly category: AiErrorCategory = 'SERVER_OUTAGE',
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export class AiInvalidConfigurationError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Invalid request configuration or unsupported parameter') {
    super(message, provider, 400, false, false, 'INVALID_CONFIGURATION');
    this.name = 'AiInvalidConfigurationError';
  }
}

export class AiRateLimitError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Rate limit exceeded', retryAfterSeconds?: number) {
    super(message, provider, 429, true, false, 'RATE_LIMITED', retryAfterSeconds);
    this.name = 'AiRateLimitError';
  }
}

export class AiQuotaError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Quota exhausted', retryAfterSeconds?: number) {
    super(message, provider, 429, false, true, 'QUOTA_EXHAUSTED', retryAfterSeconds);
    this.name = 'AiQuotaError';
  }
}

export class AiAuthError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Authentication failed / Invalid API key') {
    super(message, provider, 401, false, false, 'AUTHENTICATION_FAILURE');
    this.name = 'AiAuthError';
  }
}

export class AiInsufficientBalanceError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Insufficient balance on provider account') {
    super(message, provider, 402, false, false, 'INSUFFICIENT_BALANCE');
    this.name = 'AiInsufficientBalanceError';
  }
}

export class AiForbiddenError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Permission denied / Account lacks access to resource') {
    super(message, provider, 403, false, false, 'PERMISSION_DENIED');
    this.name = 'AiForbiddenError';
  }
}

export class AiModelNotFoundError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Model not found or unsupported for operation') {
    super(message, provider, 404, false, false, 'MODEL_NOT_FOUND');
    this.name = 'AiModelNotFoundError';
  }
}

export class AiServerError extends AiProviderError {
  constructor(provider: AiProviderName, statusCode = 500, message = 'Provider server error', retryAfterSeconds?: number) {
    super(message, provider, statusCode, true, false, 'SERVER_OUTAGE', retryAfterSeconds);
    this.name = 'AiServerError';
  }
}

export class AiTimeoutError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Provider request timed out') {
    super(message, provider, 408, true, false, 'TIMEOUT');
    this.name = 'AiTimeoutError';
  }
}

export class AiEmptyResponseError extends AiProviderError {
  constructor(provider: AiProviderName, message = 'Provider returned empty or malformed response') {
    super(message, provider, 502, true, false, 'EMPTY_RESPONSE');
    this.name = 'AiEmptyResponseError';
  }
}

export interface AiProvider {
  readonly name: AiProviderName;
  isConfigured(): boolean;
  getDefaultModel(): string;
  getEffectiveTokenLimit?(model: string, requestedTokens?: number): number;
  generate(messages: AiMessageInput[], options?: AiGenerateOptions): Promise<AiGenerateResult>;
  testConnection(model?: string, prompt?: string): Promise<AiTestResult>;
  discoverModels(): Promise<DiscoveredModel[]>;
}
