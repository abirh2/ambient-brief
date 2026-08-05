import { apiFetch } from '../../lib/api/apiClient';
import { cacheService } from '../../lib/api/cacheService';
import { loadRemoteData, revalidateRemoteData } from '../../lib/api/remoteDataClient';
import { AppApiError, type RemoteData } from '../../lib/api/types';
import { MARKET_SNAPSHOT_URL } from './config';
import type { MarketSnapshot } from './model';
import { MarketSnapshotSchema } from './schemas';

export const MARKET_CACHE_KEY = 'markets-snapshot-v1';
export const MARKET_CACHE_POLICY = {
  freshForMs: 5 * 60 * 1_000,
  staleForMs: 7 * 24 * 60 * 60 * 1_000,
};

export function clearMarketCache(): void {
  cacheService.clearKey(MARKET_CACHE_KEY);
}

export function isMarketCacheStale(): boolean {
  const cached = cacheService.readCache<unknown>(MARKET_CACHE_KEY, MARKET_CACHE_POLICY);
  if (cached.state !== 'fresh') return true;
  return !MarketSnapshotSchema.safeParse(cached.data).success;
}

export async function loadMarketSnapshot(
  forceRefresh = false,
  signal?: AbortSignal,
): Promise<RemoteData<MarketSnapshot>> {
  const options = {
    cacheKey: MARKET_CACHE_KEY,
    cachePolicy: MARKET_CACHE_POLICY,
    fetcher: (requestSignal: AbortSignal) => fetchMarketSnapshot(requestSignal, forceRefresh),
    signal,
  };
  let result = forceRefresh
    ? await revalidateRemoteData(options)
    : await loadRemoteData(options);

  // A stale cache remains available as failure fallback, but startup/visibility
  // checks wait for the deduplicated revalidation so the displayed state can advance.
  if (!forceRefresh && result.status === 'success' && result.source === 'cache' && result.freshness === 'stale') {
    result = await revalidateRemoteData(options);
  }

  if (result.status !== 'success') return result;
  const validated = MarketSnapshotSchema.safeParse(result.data);
  if (validated.success) return { ...result, data: validated.data };

  clearMarketCache();
  if (result.source === 'network') return invalidSnapshotResult();
  const retry = await revalidateRemoteData({ ...options, fetcher: (requestSignal) => fetchMarketSnapshot(requestSignal, true) });
  if (retry.status !== 'success') return retry;
  const retried = MarketSnapshotSchema.safeParse(retry.data);
  return retried.success ? { ...retry, data: retried.data } : invalidSnapshotResult();
}

async function fetchMarketSnapshot(signal: AbortSignal, bypassCache: boolean): Promise<MarketSnapshot> {
  const url = bypassCache
    ? `${MARKET_SNAPSHOT_URL}?refresh=${Date.now()}`
    : MARKET_SNAPSHOT_URL;
  return apiFetch(url, {
    signal,
    timeoutMs: 8_000,
    retries: 1,
    cache: bypassCache ? 'no-store' : 'no-cache',
    providerId: 'markets',
    schema: MarketSnapshotSchema,
  });
}

function invalidSnapshotResult(): RemoteData<MarketSnapshot> {
  return {
    status: 'error',
    error: new AppApiError('invalid-response', 'The generated market snapshot is invalid.'),
  };
}
