import { useState, useCallback } from 'react';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { cacheService } from '../../../lib/api/cacheService';
import { REQUEST_POLICIES } from '../../../lib/api/policies';
import { fetchOpenMeteoAirQuality } from '../providers/openMeteoAirQualityProvider';
import { AirQualitySnapshot } from '../types';

export type AirQualityState =
  | { status: 'loading' }
  | { status: 'loaded'; data: AirQualitySnapshot }
  | { status: 'cached'; data: AirQualitySnapshot; lastUpdatedText: string }
  | { status: 'unavailable'; message: string };

export function useAirQuality() {
  const { activeLocation } = useAppLocation();
  // Cache key based on location coordinates (independent of temp units)
  const cacheKey = `aqi_v2_${activeLocation.latitude.toFixed(2)}_${activeLocation.longitude.toFixed(2)}`;
  const [aqiState, setAqiState] = useState<AirQualityState>(() => {
    const cached = cacheService.getCache<AirQualitySnapshot>(cacheKey);
    if (!cached) return { status: 'loading' };
    return cached.isStale
      ? { status: 'cached', data: cached.data, lastUpdatedText: `Showing cached AQI · Updated ${getRelativeTimeString(cached.fetchedAt)}` }
      : { status: 'loaded', data: cached.data };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAirQuality = useCallback(
    async (forceRefresh = false, signal?: AbortSignal): Promise<'success' | 'cached'> => {
      const cachedRecord = cacheService.getCache<AirQualitySnapshot>(cacheKey);

      // Paint any valid cache immediately, then revalidate in the background.
      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        setAqiState({ status: 'loaded', data: cachedRecord.data });
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

        if (!signal?.aborted) {
          cacheService.setCache(cacheKey, liveData, REQUEST_POLICIES.airQuality.ttlMs);
          setAqiState({
            status: 'loaded',
            data: liveData,
          });
        }
        return 'success';
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // On failure: fallback to existing cache if available
        const fallbackCache = cacheService.getCache<AirQualitySnapshot>(cacheKey);
        if (fallbackCache) {
          setAqiState({
            status: 'cached',
            data: fallbackCache.data,
            lastUpdatedText: `Showing cached AQI · Connection failed · Updated ${getRelativeTimeString(
              fallbackCache.fetchedAt
            )}`,
          });
          return 'cached';
        } else {
          setAqiState({
            status: 'unavailable',
            message: 'AQI unavailable.',
          });
          throw error;
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeLocation, cacheKey]
  );

  const refreshAirQuality = useCallback((signal?: AbortSignal) => {
    setIsRefreshing(true);
    return loadAirQuality(true, signal);
  }, [loadAirQuality]);

  return {
    aqiState,
    isRefreshing,
    refreshAirQuality,
    loadAirQuality,
    isAirQualityStale: () => cacheService.getCache<AirQualitySnapshot>(cacheKey)?.isStale ?? true,
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
