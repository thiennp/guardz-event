export interface ValidationError {
  readonly code: 'VALIDATION_ERROR';
  readonly message: string;
  readonly field?: string;
  readonly value?: any;
}

export interface SecurityError {
  readonly code: 'SECURITY_ERROR';
  readonly message: string;
  readonly origin?: string;
  readonly source?: string;
}

export interface NetworkError {
  readonly code: 'NETWORK_ERROR';
  readonly message: string;
  readonly url?: string;
}

export interface TimeoutError {
  readonly code: 'TIMEOUT_ERROR';
  readonly message: string;
  readonly timeout?: number;
}

export interface UnknownError {
  readonly code: 'UNKNOWN_ERROR';
  readonly message: string;
  readonly originalError?: unknown;
}

export type EventError =
  | ValidationError
  | SecurityError
  | NetworkError
  | TimeoutError
  | UnknownError; 