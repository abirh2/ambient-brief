import { useCallback, useRef, useState } from 'react';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { useDiagnosticsStore } from '../../../lib/api/diagnosticsStore';
import { CACHE_POLICIES } from '../../../lib/api/policies';
import { cacheService } from '../../../lib/api/cacheService';
import { WeatherAlert } from '../../../lib/types';
import { fetchNWSAlerts, isActiveNWSAlert, sortNWSAlerts } from '../providers/nwsAlertsProvider';

const DISMISSED_ALERTS_KEY = 'ambient_dismissed_nws_alerts_v2';

interface DismissedAlert {
  id: string;
  expiresAt?: string;
}

function isUSLocation(countryCode: string): boolean {
  return countryCode.trim().toUpperCase() === 'US';
}

function cacheKey(latitude: number, longitude: number): string {
  return `nws-alerts:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function getDismissedAlerts(): DismissedAlert[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    const now = Date.now();
    const active = stored.filter((value): value is DismissedAlert => {
      if (!value || typeof value !== 'object') return false;
      const record = value as Record<string, unknown>;
      if (typeof record.id !== 'string') return false;
      return typeof record.expiresAt !== 'string' || Date.parse(record.expiresAt) > now;
    });
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(active));
    return active;
  } catch {
    return [];
  }
}

function withoutDismissed(alerts: WeatherAlert[]): WeatherAlert[] {
  const dismissedIds = new Set(getDismissedAlerts().map((record) => record.id));
  return sortNWSAlerts(alerts.filter((alert) => !dismissedIds.has(alert.id)));
}

export function useNWSAlerts() {
  const { activeLocation } = useAppLocation();
  const [alerts, setAlerts] = useState<WeatherAlert[]>(() => {
    if (!isUSLocation(activeLocation.countryCode)) return [];
    const cached = cacheService.readCache<WeatherAlert[]>(cacheKey(activeLocation.latitude, activeLocation.longitude), CACHE_POLICIES.nwsAlerts);
    return cached.state === 'fresh' || cached.state === 'stale'
      ? withoutDismissed(cached.data.filter((alert) => isActiveNWSAlert(alert)))
      : [];
  });
  const providerDisabledRef = useRef(false);

  const clearForUnsupportedLocation = useCallback(() => {
    setAlerts([]);
    useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
      status: 'idle',
      errorMessage: 'NWS alerts are available only for US locations.',
    });
  }, []);

  const loadNWSAlerts = useCallback(async (_force = false, signal?: AbortSignal): Promise<'success' | 'cached' | 'skipped'> => {
    if (!isUSLocation(activeLocation.countryCode)) {
      clearForUnsupportedLocation();
      return 'skipped';
    }
    if (providerDisabledRef.current) return 'skipped';

    const key = cacheKey(activeLocation.latitude, activeLocation.longitude);
    const startedAt = Date.now();
    useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', { status: 'loading', errorMessage: undefined });

    try {
      const fetchedAlerts = await fetchNWSAlerts(activeLocation.latitude, activeLocation.longitude, signal);
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      cacheService.setCache(key, fetchedAlerts, CACHE_POLICIES.nwsAlerts);
      setAlerts(withoutDismissed(fetchedAlerts));
      useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
        status: 'success', cacheSource: 'network', isStale: false,
        lastFetchedAt: new Date().toISOString(), responseTimeMs: Date.now() - startedAt,
      });
      return 'success';
    } catch (cause: unknown) {
      if (signal?.aborted || (cause instanceof Error && cause.name === 'AbortError')) throw cause;
      const cached = cacheService.readCache<WeatherAlert[]>(key, CACHE_POLICIES.nwsAlerts);
      if (cached.state === 'fresh' || cached.state === 'stale') {
        setAlerts(withoutDismissed(cached.data.filter((alert) => isActiveNWSAlert(alert))));
        useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
          status: 'success', cacheSource: 'cache', isStale: true, responseTimeMs: Date.now() - startedAt,
          errorMessage: 'Live NWS request failed; showing cached alerts.',
        });
        return 'cached';
      }

      const isDirectAccessFailure = cause instanceof TypeError;
      if (isDirectAccessFailure) providerDisabledRef.current = true;
      useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
        status: 'error', errorCategory: isDirectAccessFailure ? 'network' : 'http', responseTimeMs: Date.now() - startedAt,
        errorMessage: isDirectAccessFailure
          ? 'NWS browser access is unavailable from this origin. Alerts are disabled; no proxy is used.'
          : cause instanceof Error ? cause.message : 'NWS alerts request failed.',
      });
      setAlerts([]);
      throw cause;
    }
  }, [activeLocation, clearForUnsupportedLocation]);

  const dismissAlert = useCallback((id: string, expiresAt?: string) => {
    const active = getDismissedAlerts().filter((record) => record.id !== id);
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...active, { id, expiresAt }]));
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const isAlertsStale = useCallback(() => {
    if (!isUSLocation(activeLocation.countryCode) || providerDisabledRef.current) return false;
    const cached = cacheService.readCache<WeatherAlert[]>(cacheKey(activeLocation.latitude, activeLocation.longitude), CACHE_POLICIES.nwsAlerts);
    return cached.state !== 'fresh';
  }, [activeLocation]);

  return { alerts, dismissAlert, refreshAlerts: loadNWSAlerts, isAlertsStale };
}
