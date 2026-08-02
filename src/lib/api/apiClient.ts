import { ApiError, ApiErrorCode, FetchOptions } from './types';
import { useDiagnosticsStore } from './diagnosticsStore';

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Reusable, typed fetch wrapper with timeouts, retries, schema validation,
 * error handling, and diagnostic logging.
 */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions<T> & { providerId?: string } = {}
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    headers,
    schema,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    requestId = Math.random().toString(36).substring(2, 9),
    providerId,
  } = options;

  let attempt = 0;
  const startTime = Date.now();

  if (providerId) {
    useDiagnosticsStore.getState().updateDiagnostic(providerId, {
      status: 'loading',
      errorMessage: undefined,
    });
  }

  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();

    // Link parent signal if provided
    const onParentAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) {
        const error: ApiError = {
          code: 'aborted',
          message: 'The request was cancelled by the client.',
        };
        recordDiagnosticError(providerId, error, Date.now() - startTime);
        throw error;
      }
      signal.addEventListener('abort', onParentAbort);
    }

    // Set up timeout timer
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...headers,
        },
      });

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onParentAbort);

      const responseTimeMs = Date.now() - startTime;

      // Check HTTP Status
      if (!response.ok) {
        const status = response.status;
        let code: ApiErrorCode = 'http';
        let message = `HTTP request failed with status ${status}`;
        let retryAfterSeconds: number | undefined = undefined;

        if (status === 429) {
          code = 'rate-limit';
          message = 'Rate limit exceeded. Please try again later.';
          const retryAfterHeader = response.headers.get('Retry-After');
          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds)) {
              retryAfterSeconds = parsedSeconds;
            }
          }
        }

        const apiError: ApiError = {
          code,
          message,
          status,
          retryAfterSeconds,
        };

        // Determine if error is retryable (e.g. 5xx or rate limit without immediate lockout)
        if (attempt <= retries && (status >= 500 || status === 429)) {
          await delay(retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }

        recordDiagnosticError(providerId, apiError, responseTimeMs, status);
        throw apiError;
      }

      // Parse JSON body
      let rawJson: unknown;
      try {
        rawJson = await response.json();
      } catch (jsonErr) {
        const apiError: ApiError = {
          code: 'invalid-response',
          message: 'Failed to parse JSON response body.',
          status: response.status,
          cause: jsonErr,
        };
        recordDiagnosticError(providerId, apiError, responseTimeMs, response.status);
        throw apiError;
      }

      // Validate with Zod schema if supplied
      let validatedData: T;
      if (schema) {
        const parseResult = schema.safeParse(rawJson);
        if (!parseResult.success) {
          const apiError: ApiError = {
            code: 'invalid-response',
            message: `Response validation failed: ${parseResult.error.issues[0]?.message || 'Schema mismatch'}`,
            status: response.status,
            cause: parseResult.error,
          };
          recordDiagnosticError(providerId, apiError, responseTimeMs, response.status);
          throw apiError;
        }
        validatedData = parseResult.data;
      } else {
        validatedData = rawJson as T;
      }

      // Record success diagnostic
      if (providerId) {
        useDiagnosticsStore.getState().updateDiagnostic(providerId, {
          status: 'success',
          lastFetchedAt: new Date().toISOString(),
          cacheSource: 'network',
          isStale: false,
          responseTimeMs,
          statusCode: response.status,
          errorCategory: undefined,
          errorMessage: undefined,
        });
      }

      return validatedData;
    } catch (err) {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onParentAbort);

      const responseTimeMs = Date.now() - startTime;

      // Handle ApiError directly
      if (isApiError(err)) {
        if (attempt <= retries && isRetryableCode(err.code)) {
          await delay(retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        recordDiagnosticError(providerId, err, responseTimeMs, err.status);
        throw err;
      }

      // Handle Abort or Timeout errors
      if (err instanceof DOMException && err.name === 'AbortError') {
        const isParentAborted = signal?.aborted;
        const code: ApiErrorCode = isParentAborted ? 'aborted' : 'timeout';
        const message = isParentAborted
          ? 'Request was aborted.'
          : `Request timed out after ${timeoutMs}ms.`;

        const apiError: ApiError = { code, message, cause: err };

        if (!isParentAborted && attempt <= retries) {
          await delay(retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }

        recordDiagnosticError(providerId, apiError, responseTimeMs);
        throw apiError;
      }

      // Handle generic Network / Fetch errors
      const apiError: ApiError = {
        code: 'network',
        message: 'Network connection error or offline status.',
        cause: err,
      };

      if (attempt <= retries) {
        await delay(retryDelayMs * Math.pow(2, attempt - 1));
        continue;
      }

      recordDiagnosticError(providerId, apiError, responseTimeMs);
      throw apiError;
    }
  }

  // Fallback exhaust return error
  const finalError: ApiError = {
    code: 'unknown',
    message: `Request failed after ${retries} attempts [req: ${requestId}]`,
  };
  recordDiagnosticError(providerId, finalError, Date.now() - startTime);
  throw finalError;
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as ApiError).code === 'string'
  );
}

function isRetryableCode(code: ApiErrorCode): boolean {
  return code === 'network' || code === 'timeout';
}

function recordDiagnosticError(
  providerId?: string,
  error?: ApiError,
  responseTimeMs?: number,
  statusCode?: number
) {
  if (!providerId || !error) return;
  useDiagnosticsStore.getState().updateDiagnostic(providerId, {
    status: 'error',
    responseTimeMs,
    statusCode: statusCode || error.status,
    errorCategory: error.code,
    errorMessage: error.message,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
