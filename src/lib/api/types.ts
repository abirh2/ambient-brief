import { z } from 'zod';

export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'http'
  | 'invalid-response'
  | 'rate-limit'
  | 'aborted'
  | 'configuration'
  | 'unknown';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  status?: number;
  retryAfterSeconds?: number;
  cause?: unknown;
}

export type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading'; previousData?: T }
  | {
      status: 'success';
      data: T;
      fetchedAt: string;
      source: 'network' | 'cache';
      isStale: boolean;
    }
  | {
      status: 'error';
      error: ApiError;
      previousData?: T;
      fetchedAt?: string;
    };

export interface FetchOptions<T = unknown> {
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  schema?: z.ZodType<T>;
  retries?: number;
  retryDelayMs?: number;
  requestId?: string;
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
