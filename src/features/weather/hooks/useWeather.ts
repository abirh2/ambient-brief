import { useState, useCallback } from 'react';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { cacheService } from '../../../lib/api/cacheService';
import { REQUEST_POLICIES } from '../../../lib/api/policies';
import { fetchWeatherData } from '../weatherService';
import { WeatherData, WeatherState } from '../../../lib/types';
import { AMBIENT_WEATHER_MOCK } from '../../../mocks/ambientData';

export function useWeather() {
  const { settings } = useSettingsStore();
  const { activeLocation } = useAppLocation();
  const { weatherStatus: devWeatherStatus } = useDevStateStore();

  const cacheKey = `weather_v2_${activeLocation.latitude.toFixed(2)}_${activeLocation.longitude.toFixed(
    2
  )}_${settings.temperatureUnit}`;
  const [weatherState, setWeatherState] = useState<WeatherState>(() => {
    const cached = cacheService.getCache<WeatherData>(cacheKey);
    if (!cached) return { status: 'loading' };
    return cached.isStale
      ? { status: 'cached', data: cached.data, lastUpdatedText: `Showing cached weather · Updated ${getRelativeTimeString(cached.fetchedAt)}` }
      : { status: 'loaded', data: cached.data };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDemoMode = import.meta.env.DEV && settings.isDemoMode;

  const loadWeather = useCallback(
    async (forceRefresh = false, signal?: AbortSignal): Promise<'success' | 'cached' | 'skipped'> => {
      // 1. Check if dev status override is set to a non-'loaded' mock state
      if (import.meta.env.DEV && devWeatherStatus === 'permission_denied') {
        setWeatherState({
          status: 'permission_denied',
          message:
            'Weather information requires location access. You can enter a location manually in Settings or grant browser permission.',
        });
        return 'skipped';
      }

      if (import.meta.env.DEV && devWeatherStatus === 'location_unavailable') {
        setWeatherState({
          status: 'location_unavailable',
          message: 'Unable to retrieve weather data for the specified location.',
        });
        return 'skipped';
      }

      if (import.meta.env.DEV && devWeatherStatus === 'loading') {
        setWeatherState({ status: 'loading' });
        return 'skipped';
      }

      if (import.meta.env.DEV && devWeatherStatus === 'cached') {
        setWeatherState({
          status: 'cached',
          data: AMBIENT_WEATHER_MOCK,
          lastUpdatedText: 'Showing cached weather · Last updated 1 hour ago',
        });
        return 'success';
      }

      // 2. Check local cache first
      const cachedRecord = cacheService.getCache<WeatherData>(cacheKey);

      // Paint any valid cache immediately, then revalidate in the background.
      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        setWeatherState({ status: 'loaded', data: cachedRecord.data });
      }

      if (cachedRecord?.isStale && !forceRefresh) {
        setWeatherState({
          status: 'cached',
          data: cachedRecord.data,
          lastUpdatedText: `Showing cached weather · Updated ${getRelativeTimeString(
            cachedRecord.fetchedAt
          )}`,
        });
      } else if (!cachedRecord) {
        setWeatherState({ status: 'loading' });
      }

      try {
        const liveData = await fetchWeatherData(
          activeLocation,
          settings.temperatureUnit,
          signal
        );

        if (!signal?.aborted) {
          // Store in cache
          cacheService.setCache(cacheKey, liveData, REQUEST_POLICIES.weather.ttlMs);

          setWeatherState({
            status: 'loaded',
            data: liveData,
          });
        }
        return 'success';
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // On network error: fallback to existing cache if available
        const fallbackCache = cacheService.getCache<WeatherData>(cacheKey);
        if (fallbackCache) {
          setWeatherState({
            status: 'cached',
            data: fallbackCache.data,
            lastUpdatedText: `Showing cached weather · Connection failed · Updated ${getRelativeTimeString(
              fallbackCache.fetchedAt
            )}`,
          });
          return 'cached';
        } else {
          // If no cache and demo mode is enabled, fall back to mock data; otherwise show unavailable error state
          if (isDemoMode) {
            setWeatherState({ status: 'loaded', data: AMBIENT_WEATHER_MOCK });
          } else {
            setWeatherState({
              status: 'location_unavailable',
              message: 'Unable to connect to weather service. No cached data available.',
            });
          }
          throw error;
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [
      activeLocation,
      settings.temperatureUnit,
      isDemoMode,
      devWeatherStatus,
      cacheKey,
    ]
  );

  const refreshWeather = useCallback((signal?: AbortSignal) => {
    setIsRefreshing(true);
    return loadWeather(true, signal);
  }, [loadWeather]);

  return {
    weatherState,
    isRefreshing,
    refreshWeather,
    loadWeather,
    isWeatherStale: () => cacheService.getCache<WeatherData>(cacheKey)?.isStale ?? true,
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
