import { useDiagnosticsStore } from './diagnosticsStore';
import { AppApiError, FetchOptions } from './types';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 500;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Typed JSON fetch with bounded retries and normalized browser/network errors. */
export async function apiFetch<T>(url: string, options: FetchOptions<T> = {}): Promise<T> {
  const configError = validateConfiguration(url, options);
  if (configError) throw configError;

  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    headers,
    schema,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    providerId,
    method = 'GET',
    ...requestInit
  } = options;
  const normalizedMethod = method.toUpperCase();
  const startedAt = Date.now();
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json');

  recordDiagnostic(providerId, { status: 'loading', errorMessage: undefined });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchOnce(url, {
        ...requestInit,
        method: normalizedMethod,
        headers: requestHeaders,
        signal,
        timeoutMs,
      });

      if (!response.ok) throw createHttpError(response);

      let body: unknown;
      try {
        body = await response.json();
      } catch (cause) {
        throw new AppApiError('invalid-response', 'The response body is not valid JSON.', {
          status: response.status,
          cause,
        });
      }

      if (schema) {
        const result = schema.safeParse(body);
        if (!result.success) {
          throw new AppApiError('invalid-response', 'Response validation failed.', {
            status: response.status,
            cause: result.error,
          });
        }
        recordSuccess(providerId, startedAt, response.status);
        return result.data;
      }

      recordSuccess(providerId, startedAt, response.status);
      return body as T;
    } catch (cause) {
      const error = normalizeError(cause, signal, timeoutMs);
      const mayRetry =
        attempt < retries &&
        SAFE_METHODS.has(normalizedMethod) &&
        isTransient(error);

      if (!mayRetry) {
        recordFailure(providerId, error, startedAt);
        throw error;
      }

      const retryAfterMs = (error.retryAfterSeconds ?? 0) * 1_000;
      const exponentialDelayMs = retryDelayMs * 2 ** attempt;
      await abortableDelay(Math.max(retryAfterMs, exponentialDelayMs), signal);
    }
  }

  throw new AppApiError('unknown', 'The request failed unexpectedly.');
}

interface FetchOnceOptions extends RequestInit {
  timeoutMs: number;
  signal?: AbortSignal;
}

async function fetchOnce(url: string, options: FetchOnceOptions): Promise<Response> {
  const { timeoutMs, signal, ...requestInit } = options;
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort(signal?.reason);

  if (signal?.aborted) {
    throw new AppApiError('aborted', 'The request was cancelled.');
  }
  signal?.addEventListener('abort', onAbort, { once: true });

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...requestInit, signal: controller.signal });
  } catch (cause) {
    if (signal?.aborted) {
      throw new AppApiError('aborted', 'The request was cancelled.', { cause });
    }
    if (timedOut) {
      throw new AppApiError('timeout', `The request timed out after ${timeoutMs}ms.`, { cause });
    }
    throw cause;
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}

function validateConfiguration<T>(url: string, options: FetchOptions<T>): AppApiError | null {
  if (url.trim().length === 0) {
    return new AppApiError('configuration', 'A request URL is required.');
  }
  try {
    const baseUrl = typeof document === 'undefined' ? 'http://localhost' : document.baseURI;
    const parsedUrl = new URL(url, baseUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new AppApiError('configuration', 'Only HTTP and HTTPS request URLs are supported.');
    }
    new Headers(options.headers);
  } catch (cause) {
    return new AppApiError('configuration', 'The request URL or headers are invalid.', { cause });
  }
  const method = options.method ?? 'GET';
  if ((method === 'GET' || method === 'HEAD') && options.body !== undefined) {
    return new AppApiError('configuration', `${method} requests cannot include a body.`);
  }
  if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    return new AppApiError('configuration', 'timeoutMs must be a positive finite number.');
  }
  if (options.retries !== undefined && (!Number.isInteger(options.retries) || options.retries < 0)) {
    return new AppApiError('configuration', 'retries must be a non-negative integer.');
  }
  if (
    options.retryDelayMs !== undefined &&
    (!Number.isFinite(options.retryDelayMs) || options.retryDelayMs < 0)
  ) {
    return new AppApiError('configuration', 'retryDelayMs must be a non-negative finite number.');
  }
  return null;
}

function createHttpError(response: Response): AppApiError {
  if (response.status === 429) {
    return new AppApiError('rate-limit', 'The provider rate limit was exceeded.', {
      status: response.status,
      retryAfterSeconds: parseRetryAfter(response.headers.get('Retry-After')),
    });
  }
  return new AppApiError('http', `HTTP request failed with status ${response.status}.`, {
    status: response.status,
  });
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return undefined;
  return Math.max(0, Math.ceil((dateMs - Date.now()) / 1_000));
}

function normalizeError(cause: unknown, signal: AbortSignal | undefined, timeoutMs: number): AppApiError {
  if (cause instanceof AppApiError) return cause;
  if (signal?.aborted) return new AppApiError('aborted', 'The request was cancelled.', { cause });
  if (cause instanceof DOMException && cause.name === 'AbortError') {
    return new AppApiError('timeout', `The request timed out after ${timeoutMs}ms.`, { cause });
  }
  return new AppApiError('network', 'The network request failed.', { cause });
}

function isTransient(error: AppApiError): boolean {
  return (
    error.code === 'network' ||
    error.code === 'timeout' ||
    (error.status !== undefined && TRANSIENT_STATUSES.has(error.status))
  );
}

function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new AppApiError('aborted', 'The request was cancelled.'));
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      globalThis.clearTimeout(timeoutId);
      reject(new AppApiError('aborted', 'The request was cancelled.'));
    };
    const timeoutId = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function recordSuccess(providerId: string | undefined, startedAt: number, statusCode: number): void {
  recordDiagnostic(providerId, {
    status: 'success',
    lastFetchedAt: new Date().toISOString(),
    cacheSource: 'network',
    isStale: false,
    responseTimeMs: Date.now() - startedAt,
    statusCode,
    errorCategory: undefined,
    errorMessage: undefined,
  });
}

function recordFailure(providerId: string | undefined, error: AppApiError, startedAt: number): void {
  recordDiagnostic(providerId, {
    status: 'error',
    responseTimeMs: Date.now() - startedAt,
    statusCode: error.status,
    errorCategory: error.code,
    errorMessage: error.message,
  });
}

function recordDiagnostic(
  providerId: string | undefined,
  update: Parameters<ReturnType<typeof useDiagnosticsStore.getState>['updateDiagnostic']>[1],
): void {
  if (!import.meta.env.DEV || !providerId) return;
  useDiagnosticsStore.getState().updateDiagnostic(providerId, update);
}
