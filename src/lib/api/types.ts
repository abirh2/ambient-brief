import { z } from 'zod';

export type ApiErrorCode =
  | 'network'
  | 'offline'
  | 'timeout'
  | 'http'
  | 'invalid-response'
  | 'rate-limit'
  | 'aborted'
  | 'configuration'
  | 'unknown';

export interface AppApiErrorOptions {
  status?: number;
  retryAfterSeconds?: number;
  cause?: unknown;
}

/** A single error shape for every failure that crosses the browser API boundary. */
export class AppApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly retryAfterSeconds?: number;
  override readonly cause?: unknown;

  constructor(code: ApiErrorCode, message: string, options: AppApiErrorOptions = {}) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.cause = options.cause;
  }
}

// Kept as an alias while existing feature code migrates to the clearer name.
export type ApiError = AppApiError;

export type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading'; previousData?: T }
  | {
      status: 'success';
      data: T;
      fetchedAt: string;
      source: 'network' | 'cache';
      freshness: 'fresh' | 'stale';
    }
  | {
      status: 'error';
      error: AppApiError;
      previousData?: T;
    };

export interface FetchOptions<T = unknown>
  extends Omit<RequestInit, 'method' | 'signal' | 'headers'> {
  method?: 'GET' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: HeadersInit;
  schema?: z.ZodType<T>;
  retries?: number;
  retryDelayMs?: number;
  providerId?: string;
}

export interface ProviderDiagnostic {
  providerId: string;
  providerName: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  lastFetchedAt?: string;
  cacheSource?: 'network' | 'cache';
  isStale?: boolean;
  responseTimeMs?: number;
  statusCode?: number;
  errorCategory?: ApiErrorCode;
  errorMessage?: string;
}
