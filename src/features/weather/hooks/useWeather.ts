import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { cacheService } from '../../../lib/api/cacheService';
import { REQUEST_POLICIES } from '../../../lib/api/policies';
import { fetchWeatherData, fetchMockWeatherData } from '../weatherService';
import { WeatherData, WeatherState } from '../../../lib/types';
import { AMBIENT_WEATHER_MOCK } from '../../../mocks/ambientData';

export function useWeather() {
  const { settings } = useSettingsStore();
  const { activeLocation } = useAppLocation();
  const { weatherStatus: devWeatherStatus } = useDevStateStore();

  const [weatherState, setWeatherState] = useState<WeatherState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Construct cache key based on location coordinates and unit
  const cacheKey = `weather_v1_${activeLocation.latitude.toFixed(2)}_${activeLocation.longitude.toFixed(
    2
  )}_${settings.temperatureUnit}`;

  const loadWeather = useCallback(
    async (forceRefresh = false) => {
      // 1. Check if dev status override is set to a non-'loaded' mock state
      if (devWeatherStatus === 'permission_denied') {
        setWeatherState({
          status: 'permission_denied',
          message:
            'Weather information requires location access. You can enter a location manually in Settings or grant browser permission.',
        });
        return;
      }

      if (devWeatherStatus === 'location_unavailable') {
        setWeatherState({
          status: 'location_unavailable',
          message: 'Unable to retrieve weather data for the specified location.',
        });
        return;
      }

      if (devWeatherStatus === 'loading') {
        setWeatherState({ status: 'loading' });
        return;
      }

      if (devWeatherStatus === 'cached') {
        setWeatherState({
          status: 'cached',
          data: AMBIENT_WEATHER_MOCK,
          lastUpdatedText: 'Showing cached weather · Last updated 1 hour ago',
        });
        return;
      }

      // 2. Check local cache first
      const cachedRecord = cacheService.getCache<WeatherData>(cacheKey);

      // If fresh cache exists and not force refreshing, use it
      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        setWeatherState({ status: 'loaded', data: cachedRecord.data });
        return;
      }

      // If stale cache exists, serve it immediately while revalidating in background
      if (cachedRecord && !forceRefresh) {
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

      // 3. Cancel any in-flight weather request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const liveData = await fetchWeatherData(
          activeLocation,
          settings.temperatureUnit,
          controller.signal
        );

        if (!controller.signal.aborted) {
          // Store in cache
          cacheService.setCache(cacheKey, liveData, REQUEST_POLICIES.weather.ttlMs);

          setWeatherState({
            status: 'loaded',
            data: liveData,
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
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
        } else {
          // If no cache and demo mode is enabled, fall back to mock data; otherwise show unavailable error state
          if (settings.isDemoMode) {
            try {
              const mockData = fetchMockWeatherData();
              setWeatherState({ status: 'loaded', data: mockData });
            } catch {
              setWeatherState({
                status: 'location_unavailable',
                message: 'Unable to connect to weather service. Please check your internet connection.',
              });
            }
          } else {
            setWeatherState({
              status: 'location_unavailable',
              message: 'Unable to connect to weather service. No cached data available.',
            });
          }
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [
      activeLocation,
      settings.temperatureUnit,
      settings.isDemoMode,
      devWeatherStatus,
      cacheKey,
    ]
  );

  // Trigger refetch when location, unit, or dev override changes
  useEffect(() => {
    loadWeather();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadWeather]);

  const refreshWeather = useCallback(() => {
    setIsRefreshing(true);
    loadWeather(true);
  }, [loadWeather]);

  return {
    weatherState,
    isRefreshing,
    refreshWeather,
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
