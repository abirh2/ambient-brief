import { useState, useCallback, useRef } from 'react';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { cacheService } from '../../../lib/api/cacheService';
import { REQUEST_POLICIES } from '../../../lib/api/policies';
import { fetchOpenMeteoAirQuality } from '../providers/openMeteoAirQualityProvider';
import { AirQualitySnapshot } from '../types';
import { AirQualitySnapshotSchema } from '../model';
import { readContextCache, type AcceptedMetadata } from '../../../lib/api/contextCache';

export type AirQualityState =
  | { status: 'loading' }
  | { status: 'loaded'; data: AirQualitySnapshot }
  | { status: 'cached'; data: AirQualitySnapshot; lastUpdatedText: string }
  | { status: 'unavailable'; message: string };

export function useAirQuality() {
  const { activeLocation } = useAppLocation();
  // Cache key based on location coordinates (independent of temp units)
  const cacheKey = `aqi_v2_${activeLocation.latitude.toFixed(2)}_${activeLocation.longitude.toFixed(2)}`;
  const contextKey = JSON.stringify(activeLocation);
  const identity = useRef({ key: contextKey, generation: 0 });
  if (identity.current.key !== contextKey) identity.current = { key: contextKey, generation: identity.current.generation + 1 };
  const retained = useRef<{ contextKey: string; data: AirQualitySnapshot; fetchedAt: string } | null>(null);
  const readCache = useCallback(() => {
    const cached = readContextCache(cacheKey, contextKey, AirQualitySnapshotSchema);
    if (cached) return cached;
    const previous = retained.current;
    const age = previous ? Date.now() - Date.parse(previous.fetchedAt) : Number.POSITIVE_INFINITY;
    return previous?.contextKey === contextKey && age >= 0 && age <= 30 * 60_000 + 24 * 60 * 60_000
      ? { data: previous.data, fetchedAt: previous.fetchedAt, isStale: age > 30 * 60_000 } : null;
  }, [cacheKey, contextKey]);
  const [accepted, setAccepted] = useState<{ key: string; state: AirQualityState; metadata: AcceptedMetadata | null }>(() => {
    const cached = readCache();
    return { key: contextKey, state: cached ? { status: 'cached', data: cached.data, lastUpdatedText: 'Showing cached AQI' } : { status: 'loading' }, metadata: cached ? { contextKey, origin: 'cache', freshness: cached.isStale ? 'stale' : 'cached', successfulFetchAt: cached.fetchedAt } : null };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cachedNow = readCache();
  const acceptedExpired = accepted.metadata?.origin !== 'demo' && accepted.metadata?.successfulFetchAt && Date.now() - Date.parse(accepted.metadata.successfulFetchAt) > 24 * 60 * 60_000 + 30 * 60_000;
  const aqiState: AirQualityState = accepted.key === contextKey ? acceptedExpired ? { status: 'unavailable', message: 'Cached AQI expired.' } : accepted.state : cachedNow
    ? { status: 'cached', data: cachedNow.data, lastUpdatedText: 'Showing cached AQI' } : { status: 'loading' };

  const loadAirQuality = useCallback(
    async (forceRefresh = false, signal?: AbortSignal): Promise<'success' | 'cached'> => {
      signal?.throwIfAborted();
      const generation = ++identity.current.generation;
      const current = () => identity.current.key === contextKey && identity.current.generation === generation && !signal?.aborted;
      const setAqiState = (state: AirQualityState, metadata: AcceptedMetadata | null = null) => {
        if (current()) {
          const cached = readCache();
          const effectiveMetadata = metadata ?? (state.status === 'cached' && cached ? { contextKey, origin: 'cache' as const, freshness: cached.isStale ? 'stale' as const : 'cached' as const, successfulFetchAt: cached.fetchedAt } : null);
          if ('data' in state && effectiveMetadata?.successfulFetchAt && effectiveMetadata.origin !== 'demo') retained.current = { contextKey, data: state.data, fetchedAt: effectiveMetadata.successfulFetchAt };
          setAccepted({ key: contextKey, state, metadata: effectiveMetadata });
        }
      };
      const cachedRecord = readCache();

      // Paint any valid cache immediately, then revalidate in the background.
      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        setAqiState({ status: 'cached', data: cachedRecord.data, lastUpdatedText: 'Showing cached AQI' }, { contextKey, origin: 'cache', freshness: 'cached', successfulFetchAt: cachedRecord.fetchedAt });
      }

      if (cachedRecord?.isStale && !forceRefresh) {
        setAqiState({
          status: 'cached',
          data: cachedRecord.data,
          lastUpdatedText: `Showing cached AQI · Updated ${getRelativeTimeString(
            cachedRecord.fetchedAt
          )}`,
        });
      } else if (!cachedRecord) {
        setAqiState({ status: 'loading' });
      }

      try {
        const liveData = await fetchOpenMeteoAirQuality(activeLocation, {
          signal,
        });

        if (current()) {
          cacheService.setCache(cacheKey, { contextKey, value: liveData }, REQUEST_POLICIES.airQuality.ttlMs);
          setAqiState({
            status: 'loaded',
            data: liveData,
          }, { contextKey, origin: 'network', freshness: 'delayed', successfulFetchAt: new Date().toISOString(), lastCheck: { at: new Date().toISOString(), outcome: 'new' } });
        }
        if (!current()) throw new DOMException('Aborted', 'AbortError');
        return 'success';
      } catch (error: unknown) {
        if (!current() || (error instanceof Error && error.name === 'AbortError')) {
          throw error;
        }

        // On failure: fallback to existing cache if available
        const fallbackCache = readCache();
        if (fallbackCache) {
          setAqiState({
            status: 'cached',
            data: fallbackCache.data,
            lastUpdatedText: `Showing cached AQI · Connection failed · Updated ${getRelativeTimeString(
              fallbackCache.fetchedAt
            )}`,
          }, { contextKey, origin: 'cache', freshness: 'stale', successfulFetchAt: fallbackCache.fetchedAt, lastCheck: { at: new Date().toISOString(), outcome: 'failed' } });
          return 'cached';
        } else {
          setAqiState({
            status: 'unavailable',
            message: 'AQI unavailable.',
          });
          throw error;
        }
      } finally {
        if (identity.current.key === contextKey && identity.current.generation === generation) setIsRefreshing(false);
      }
    },
    [activeLocation, cacheKey, contextKey, readCache]
  );

  const refreshAirQuality = useCallback((signal?: AbortSignal) => {
    setIsRefreshing(true);
    return loadAirQuality(true, signal);
  }, [loadAirQuality]);

  return {
    aqiState,
    metadata: accepted.key === contextKey ? accepted.metadata : cachedNow ? { contextKey, origin: 'cache' as const, freshness: cachedNow.isStale ? 'stale' as const : 'cached' as const, successfulFetchAt: cachedNow.fetchedAt } : null,
    isRefreshing,
    refreshAirQuality,
    loadAirQuality,
    isAirQualityStale: () => readCache()?.isStale ?? true,
  };
}

function getRelativeTimeString(isoString: string): string {
  try {
    const fetched = new Date(isoString).getTime();
    const diffMs = Date.now() - fetched;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'recently';
  }
}
