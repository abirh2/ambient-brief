import { useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { cacheService } from '../../../lib/api/cacheService';
import { REQUEST_POLICIES } from '../../../lib/api/policies';
import { fetchWeatherData } from '../weatherService';
import { WeatherData, WeatherState } from '../../../lib/types';
import { WeatherDataSchema } from '../model';
import { readContextCache, type AcceptedMetadata } from '../../../lib/api/contextCache';
import { AMBIENT_WEATHER_MOCK } from '../../../mocks/ambientData';

export function useWeather() {
  const { settings } = useSettingsStore();
  const { activeLocation } = useAppLocation();
  const { weatherStatus: devWeatherStatus } = useDevStateStore();

  const cacheKey = `weather_v2_${activeLocation.latitude.toFixed(2)}_${activeLocation.longitude.toFixed(
    2
  )}_${settings.temperatureUnit}`;
  const contextKey = JSON.stringify([activeLocation, settings.temperatureUnit]);
  const identity = useRef({ key: contextKey, generation: 0 });
  if (identity.current.key !== contextKey) identity.current = { key: contextKey, generation: identity.current.generation + 1 };
  const retained = useRef<{ contextKey: string; data: WeatherData; fetchedAt: string } | null>(null);
  const readCache = useCallback(() => {
    const cached = readContextCache(cacheKey, contextKey, WeatherDataSchema.refine((value) => value.windSpeedUnit === (settings.temperatureUnit === 'celsius' ? 'km/h' : 'mph')));
    if (cached) return cached;
    const previous = retained.current;
    const age = previous ? Date.now() - Date.parse(previous.fetchedAt) : Number.POSITIVE_INFINITY;
    return previous?.contextKey === contextKey && age >= 0 && age <= 15 * 60_000 + 24 * 60 * 60_000
      ? { data: previous.data, fetchedAt: previous.fetchedAt, isStale: age > 15 * 60_000 } : null;
  }, [cacheKey, contextKey, settings.temperatureUnit]);
  const [accepted, setAccepted] = useState<{ key: string; state: WeatherState; metadata: AcceptedMetadata | null }>(() => {
    const cached = readCache();
    return { key: contextKey, state: cached ? { status: 'cached', data: cached.data, lastUpdatedText: 'Showing cached weather' } : { status: 'loading' }, metadata: cached ? { contextKey, origin: 'cache', freshness: cached.isStale ? 'stale' : 'cached', successfulFetchAt: cached.fetchedAt } : null };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cachedNow = readCache();
  const acceptedExpired = accepted.metadata?.origin !== 'demo' && accepted.metadata?.successfulFetchAt && Date.now() - Date.parse(accepted.metadata.successfulFetchAt) > 24 * 60 * 60_000 + 15 * 60_000;
  const weatherState: WeatherState = accepted.key === contextKey ? acceptedExpired ? { status: 'location_unavailable', message: 'Cached weather expired.' } : accepted.state : cachedNow
    ? { status: 'cached', data: cachedNow.data, lastUpdatedText: 'Showing cached weather' } : { status: 'loading' };
  const isDemoMode = import.meta.env.DEV && settings.isDemoMode;

  const loadWeather = useCallback(
    async (forceRefresh = false, signal?: AbortSignal): Promise<'success' | 'cached' | 'skipped'> => {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const generation = ++identity.current.generation;
      const current = () => identity.current.key === contextKey && identity.current.generation === generation && !signal?.aborted;
      const setWeatherState = (state: WeatherState, metadata: AcceptedMetadata | null = null) => {
        if (current()) {
          const cached = readCache();
          const effectiveMetadata = metadata ?? (state.status === 'cached' && cached ? { contextKey, origin: 'cache' as const, freshness: cached.isStale ? 'stale' as const : 'cached' as const, successfulFetchAt: cached.fetchedAt } : null);
          if ('data' in state && effectiveMetadata?.successfulFetchAt && effectiveMetadata.origin !== 'demo') retained.current = { contextKey, data: state.data, fetchedAt: effectiveMetadata.successfulFetchAt };
          setAccepted({ key: contextKey, state, metadata: effectiveMetadata });
        }
      };
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
          lastUpdatedText: 'Demo weather',
        }, { contextKey, origin: 'demo', freshness: 'demo', successfulFetchAt: null });
        return 'success';
      }

      // 2. Check local cache first
      const cachedRecord = readCache();

      // Paint any valid cache immediately, then revalidate in the background.
      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        setWeatherState({ status: 'cached', data: cachedRecord.data, lastUpdatedText: 'Showing cached weather' }, { contextKey, origin: 'cache', freshness: 'cached', successfulFetchAt: cachedRecord.fetchedAt });
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

        if (current()) {
          // Store in cache
          cacheService.setCache(cacheKey, { contextKey, value: liveData }, REQUEST_POLICIES.weather.ttlMs);

          setWeatherState({
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

        // On network error: fallback to existing cache if available
        const fallbackCache = readCache();
        if (fallbackCache) {
          setWeatherState({
            status: 'cached',
            data: fallbackCache.data,
            lastUpdatedText: `Showing cached weather · Connection failed · Updated ${getRelativeTimeString(
              fallbackCache.fetchedAt
            )}`,
          }, { contextKey, origin: 'cache', freshness: 'stale', successfulFetchAt: fallbackCache.fetchedAt, lastCheck: { at: new Date().toISOString(), outcome: 'failed' } });
          return 'cached';
        } else {
          // If no cache and demo mode is enabled, fall back to mock data; otherwise show unavailable error state
          if (isDemoMode) {
            setWeatherState({ status: 'loaded', data: AMBIENT_WEATHER_MOCK }, { contextKey, origin: 'demo', freshness: 'demo', successfulFetchAt: null });
          } else {
            setWeatherState({
              status: 'location_unavailable',
              message: 'Unable to connect to weather service. No cached data available.',
            });
          }
          throw error;
        }
      } finally {
        if (identity.current.key === contextKey && identity.current.generation === generation) setIsRefreshing(false);
      }
    },
    [
      activeLocation,
      settings.temperatureUnit,
      isDemoMode,
      devWeatherStatus,
      cacheKey,
      contextKey,
      readCache,
    ]
  );

  const refreshWeather = useCallback((signal?: AbortSignal) => {
    setIsRefreshing(true);
    return loadWeather(true, signal);
  }, [loadWeather]);

  return {
    weatherState,
    metadata: accepted.key === contextKey ? accepted.metadata : cachedNow ? { contextKey, origin: 'cache' as const, freshness: cachedNow.isStale ? 'stale' as const : 'cached' as const, successfulFetchAt: cachedNow.fetchedAt } : null,
    isRefreshing,
    refreshWeather,
    loadWeather,
    isWeatherStale: () => readCache()?.isStale ?? true,
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
