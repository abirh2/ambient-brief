import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { useDiagnosticsStore } from '../../../lib/api/diagnosticsStore';
import { CACHE_POLICIES } from '../../../lib/api/policies';
import { cacheService } from '../../../lib/api/cacheService';
import { WeatherAlert } from '../../../lib/types';
import { fetchNWSAlerts, firstEndTime, isActiveNWSAlert, sortNWSAlerts } from '../providers/nwsAlertsProvider';

import { z } from 'zod';
import { WeatherAlertSchema } from '../../alerts/model';
import { readContextCache } from '../../../lib/api/contextCache';

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
  const context = JSON.stringify(activeLocation);
  const identity = useRef({ key: context, generation: 0 });
  if (identity.current.key !== context) identity.current = { key: context, generation: identity.current.generation + 1 };
  type Check = 'checking' | 'checked' | 'unavailable';
  const [accepted, setAccepted] = useState<{ key: string; alerts: WeatherAlert[]; check: Check; fetchedAt: string | null; cached: boolean }>(() => {
    const cached = isUSLocation(activeLocation.countryCode) ? readContextCache(cacheKey(activeLocation.latitude, activeLocation.longitude), context, z.array(WeatherAlertSchema)) : null;
    return { key: context, alerts: cached?.data ?? [], check: 'checking', fetchedAt: cached?.fetchedAt ?? null, cached: Boolean(cached) };
  });
  const [sessionDismissed, setSessionDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const [validityTick, tick] = useState(0);
  const supported = isUSLocation(activeLocation.countryCode);
  const expiredCheck = Boolean(accepted.fetchedAt && Date.now() - Date.parse(accepted.fetchedAt) > 24 * 60 * 60_000 + CACHE_POLICIES.nwsAlerts.ttlMs);
  const alerts = !expiredCheck && supported && accepted.key === context ? withoutDismissed(accepted.alerts.filter((alert) => isActiveNWSAlert(alert) && !sessionDismissed.has(alert.id))) : [];
  useEffect(() => {
    const reconcile = () => tick((value) => value + 1);
    const expiry = accepted.key === context ? accepted.alerts.filter((alert) => isActiveNWSAlert(alert)).map(firstEndTime).filter((time): time is number => time !== null) : [];
    if (accepted.fetchedAt && !expiredCheck) expiry.push(Date.parse(accepted.fetchedAt) + 24 * 60 * 60_000 + CACHE_POLICIES.nwsAlerts.ttlMs);
    const timer = expiry.length ? setTimeout(reconcile, Math.max(0, Math.min(...expiry) - Date.now()) + 1) : undefined;
    document.addEventListener('visibilitychange', reconcile);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', reconcile); };
  }, [accepted, context, validityTick, expiredCheck]);
  const providerDisabledRef = useRef(false);

  const clearForUnsupportedLocation = useCallback(() => {
    setAccepted({ key: context, alerts: [], check: 'checking', fetchedAt: null, cached: false });
    useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
      status: 'idle',
      errorMessage: 'NWS alerts are available only for US locations.',
    });
  }, [context]);

  const loadNWSAlerts = useCallback(async (_force = false, signal?: AbortSignal): Promise<'success' | 'cached' | 'skipped'> => {
    signal?.throwIfAborted();
    const generation = ++identity.current.generation;
    const current = () => identity.current.key === context && identity.current.generation === generation && !signal?.aborted;
    if (!isUSLocation(activeLocation.countryCode)) {
      clearForUnsupportedLocation();
      return 'skipped';
    }
    if (providerDisabledRef.current) { setAccepted({ key: context, alerts: [], check: 'unavailable', fetchedAt: null, cached: false }); return 'skipped'; }

    const key = cacheKey(activeLocation.latitude, activeLocation.longitude);
    const readCache = () => readContextCache(key, context, z.array(WeatherAlertSchema));
    const cachedInitial = readCache();
    setAccepted({ key: context, alerts: cachedInitial?.data ?? [], check: 'checking', fetchedAt: cachedInitial?.fetchedAt ?? null, cached: Boolean(cachedInitial) });
    const startedAt = Date.now();
    useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', { status: 'loading', errorMessage: undefined });

    try {
      const fetchedAlerts = await fetchNWSAlerts(activeLocation.latitude, activeLocation.longitude, signal);
      if (!current()) throw new DOMException('Aborted', 'AbortError');
      cacheService.setCache(key, { contextKey: context, value: fetchedAlerts }, CACHE_POLICIES.nwsAlerts);
      setAccepted({ key: context, alerts: fetchedAlerts, check: 'checked', fetchedAt: new Date().toISOString(), cached: false });
      useDiagnosticsStore.getState().updateDiagnostic('weatherAlerts', {
        status: 'success', cacheSource: 'network', isStale: false,
        lastFetchedAt: new Date().toISOString(), responseTimeMs: Date.now() - startedAt,
      });
      return 'success';
    } catch (cause: unknown) {
      if (!current() || (cause instanceof Error && cause.name === 'AbortError')) throw cause;
      const cached = readCache();
      if (cached) {
        setAccepted({ key: context, alerts: cached.data, check: 'unavailable', fetchedAt: cached.fetchedAt, cached: true });
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
      setAccepted({ key: context, alerts: [], check: 'unavailable', fetchedAt: null, cached: false });
      throw cause;
    }
  }, [activeLocation, context, clearForUnsupportedLocation]);

  const dismissAlert = useCallback((id: string, expiresAt?: string) => {
    const active = getDismissedAlerts().filter((record) => record.id !== id);
    try { localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...active, { id, expiresAt }])); } catch { /* Session dismissal still works when storage is unavailable. */ }
    setSessionDismissed((current) => new Set([...current, id]));
  }, []);

  const isAlertsStale = useCallback(() => {
    if (!isUSLocation(activeLocation.countryCode) || providerDisabledRef.current) return false;
    const cached = readContextCache(cacheKey(activeLocation.latitude, activeLocation.longitude), context, z.array(WeatherAlertSchema));
    return !cached || cached.isStale;
  }, [activeLocation, context]);

  const hasActiveOfficialAlerts = accepted.key === context && accepted.alerts.some((alert) => isActiveNWSAlert(alert));
  const coverage = !supported ? (activeLocation.countryCode ? 'unsupported' : 'unknown') : accepted.key !== context ? 'checking' : expiredCheck ? 'unavailable' : hasActiveOfficialAlerts ? 'active' : accepted.check === 'checked' && !accepted.cached ? 'none' : accepted.check === 'checking' ? 'checking' : 'unavailable';
  return { alerts, coverage, metadata: accepted.key === context ? { contextKey: context, successfulFetchAt: accepted.fetchedAt, origin: accepted.cached ? 'cache' : 'network', freshness: accepted.cached || accepted.fetchedAt && Date.now() - Date.parse(accepted.fetchedAt) > CACHE_POLICIES.nwsAlerts.ttlMs ? 'stale' : 'delayed' } : null, dismissAlert, refreshAlerts: loadNWSAlerts, isAlertsStale };
}
