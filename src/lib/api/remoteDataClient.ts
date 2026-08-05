import { cacheService, CachePolicy, CacheReadResult } from './cacheService';
import { AppApiError, RemoteData } from './types';

export interface RemoteRequestOptions<T> {
  cacheKey: string;
  cachePolicy: CachePolicy;
  fetcher: (signal: AbortSignal) => Promise<T>;
  signal?: AbortSignal;
  forceRefresh?: boolean;
  onRevalidated?: (result: RemoteData<T>) => void;
}

interface InFlightRequest {
  controller: AbortController;
  promise: Promise<unknown>;
  consumers: number;
}

const inFlightRequests = new Map<string, InFlightRequest>();
const visibilityQueue = new Map<string, () => void>();
let visibilityListenerInstalled = false;

/**
 * Loads remote data using cache-first stale-while-revalidate semantics.
 * Stale data resolves immediately; onRevalidated receives the later network value.
 */
export async function loadRemoteData<T>(options: RemoteRequestOptions<T>): Promise<RemoteData<T>> {
  const cached = cacheService.readCache<T>(options.cacheKey, options.cachePolicy);

  if (!options.forceRefresh && cached.state === 'fresh') {
    diagnostic('cache-hit', options.cacheKey);
    return cacheSuccess(cached, 'fresh');
  }

  if (!options.forceRefresh && cached.state === 'stale') {
    scheduleRevalidation(options);
    return cacheSuccess(cached, 'stale');
  }

  if (!isOnline()) return offlineResult(cached);

  return fetchAndCache(options, cached);
}

/** Forces a network refresh while still falling back to any usable cached value. */
export async function revalidateRemoteData<T>(
  options: Omit<RemoteRequestOptions<T>, 'forceRefresh'>,
): Promise<RemoteData<T>> {
  const cached = cacheService.readCache<T>(options.cacheKey, options.cachePolicy);
  if (!isOnline()) return offlineResult(cached);
  return fetchAndCache(options, cached);
}

function scheduleRevalidation<T>(options: RemoteRequestOptions<T>): void {
  if (!isOnline()) return;

  const run = () => {
    void revalidateRemoteData(options).then((result) => {
      options.onRevalidated?.(result);
    });
  };

  if (isDocumentHidden()) {
    visibilityQueue.set(options.cacheKey, run);
    installVisibilityListener();
    diagnostic('revalidation-deferred', options.cacheKey);
    return;
  }
  run();
}

async function fetchAndCache<T>(
  options: Omit<RemoteRequestOptions<T>, 'forceRefresh'>,
  fallback: CacheReadResult<T>,
): Promise<RemoteData<T>> {
  try {
    const data = await runDeduplicated(options.cacheKey, options.fetcher, options.signal);
    const fetchedAt = new Date().toISOString();
    cacheService.setCache(options.cacheKey, data, options.cachePolicy);
    return { status: 'success', data, fetchedAt, source: 'network', freshness: 'fresh' };
  } catch (cause) {
    const error = normalizeRemoteError(cause);
    if (fallback.state !== 'miss') return cacheSuccess(fallback, 'stale');
    return { status: 'error', error };
  }
}

async function runDeduplicated<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  consumerSignal?: AbortSignal,
): Promise<T> {
  if (consumerSignal?.aborted) {
    throw new AppApiError('aborted', 'The request was cancelled.');
  }

  let entry = inFlightRequests.get(key);
  if (!entry) {
    const controller = new AbortController();
    const promise = fetcher(controller.signal).finally(() => {
      inFlightRequests.delete(key);
    });
    entry = { controller, promise, consumers: 0 };
    inFlightRequests.set(key, entry);
  } else {
    diagnostic('request-deduplicated', key);
  }

  entry.consumers += 1;
  try {
    return await waitForConsumer(entry.promise as Promise<T>, consumerSignal);
  } finally {
    entry.consumers -= 1;
    if (entry.consumers === 0 && inFlightRequests.get(key) === entry) entry.controller.abort();
  }
}

function waitForConsumer<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new AppApiError('aborted', 'The request was cancelled.'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

function cacheSuccess<T>(
  cached: Exclude<CacheReadResult<T>, { state: 'miss' }>,
  freshness: 'fresh' | 'stale',
): RemoteData<T> {
  return {
    status: 'success',
    data: cached.data,
    fetchedAt: cached.fetchedAt,
    source: 'cache',
    freshness,
  };
}

function offlineResult<T>(cached: CacheReadResult<T>): RemoteData<T> {
  if (cached.state !== 'miss') return cacheSuccess(cached, cached.state === 'fresh' ? 'fresh' : 'stale');
  return {
    status: 'error',
    error: new AppApiError('offline', 'No network connection or cached data is available.'),
  };
}

function normalizeRemoteError(cause: unknown): AppApiError {
  if (cause instanceof AppApiError) return cause;
  return new AppApiError('unknown', 'The data request failed unexpectedly.', { cause });
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function installVisibilityListener(): void {
  if (visibilityListenerInstalled || typeof document === 'undefined') return;
  visibilityListenerInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !isOnline()) return;
    const callbacks = [...visibilityQueue.values()];
    visibilityQueue.clear();
    callbacks.forEach((callback) => callback());
  });
}

function diagnostic(event: string, cacheKey: string): void {
  if (import.meta.env.DEV) console.debug(`[api] ${event}`, { cacheKey });
}
