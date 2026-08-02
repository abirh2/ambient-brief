import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [aqiState, setAqiState] = useState<AirQualityState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache key based on location coordinates (independent of temp units)
  const cacheKey = `aqi_v1_${activeLocation.latitude.toFixed(2)}_${activeLocation.longitude.toFixed(2)}`;

  const loadAirQuality = useCallback(
    async (forceRefresh = false) => {
      // If tab is hidden and not force refreshing, stop/skip background refresh
      if (typeof document !== 'undefined' && document.hidden && !forceRefresh) {
        return;
      }

      const cachedRecord = cacheService.getCache<AirQualitySnapshot>(cacheKey);

      // If fresh cache exists and not force refreshing, use it
      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        setAqiState({ status: 'loaded', data: cachedRecord.data });
        return;
      }

      // If stale cache exists, serve it immediately while revalidating in background
      if (cachedRecord && !forceRefresh) {
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

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const liveData = await fetchOpenMeteoAirQuality(activeLocation, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          cacheService.setCache(cacheKey, liveData, REQUEST_POLICIES.airQuality.ttlMs);
          setAqiState({
            status: 'loaded',
            data: liveData,
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
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
        } else {
          setAqiState({
            status: 'unavailable',
            message: 'AQI unavailable.',
          });
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeLocation, cacheKey]
  );

  // Trigger refetch when location changes
  useEffect(() => {
    loadAirQuality();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAirQuality]);

  // Document visibility change listener to refresh when tab becomes active / visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        // Tab is visible now, refresh to check if cache is stale
        loadAirQuality();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [loadAirQuality]);

  // Periodic poll every 5 minutes, checking document visibility
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadAirQuality();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [loadAirQuality]);

  const refreshAirQuality = useCallback(() => {
    setIsRefreshing(true);
    loadAirQuality(true);
  }, [loadAirQuality]);

  return {
    aqiState,
    isRefreshing,
    refreshAirQuality,
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
