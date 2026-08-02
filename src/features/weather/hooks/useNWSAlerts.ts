import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppLocation } from '../../../hooks/useAppLocation';
import { WeatherAlert } from '../../../lib/types';
import { fetchNWSAlerts, DismissedAlert } from '../providers/nwsAlertsProvider';

const DISMISSED_ALERTS_KEY = 'ambient_dismissed_nws_alerts_v1';
const CACHED_NWS_ALERTS_KEY = 'ambient_cached_nws_alerts_v1';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useNWSAlerts() {
  const { activeLocation } = useAppLocation();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper: Retrieve and clean up dismissed alerts
  const getActiveDismissedAlerts = useCallback((): DismissedAlert[] => {
    try {
      const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
      if (!stored) return [];
      const records: DismissedAlert[] = JSON.parse(stored);
      
      // Filter out records that are expired
      const now = new Date().getTime();
      const updated = records.filter((rec) => {
        if (!rec.expiresAt) return true;
        const expiry = new Date(rec.expiresAt).getTime();
        return expiry > now;
      });

      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }, []);

  // Helper: Dismiss an alert
  const dismissAlert = useCallback((id: string, expiresAt?: string) => {
    try {
      const activeDismissed = getActiveDismissedAlerts();
      if (activeDismissed.some((rec) => rec.id === id)) return;

      const newRecord: DismissedAlert = {
        id,
        dismissedAt: new Date().toISOString(),
        expiresAt,
      };

      const updated = [...activeDismissed, newRecord];
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(updated));
      
      // Update local state to remove the dismissed alert immediately from UI
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Failed to save dismissed alert:', e);
    }
  }, [getActiveDismissedAlerts]);

  // Helper: Parse cached alerts and remove expired ones
  const getCachedAlerts = useCallback((): WeatherAlert[] => {
    try {
      const stored = localStorage.getItem(CACHED_NWS_ALERTS_KEY);
      if (!stored) return [];
      const cached: WeatherAlert[] = JSON.parse(stored);

      // Filter out expired cached alerts
      const now = new Date().getTime();
      return cached.filter((alert) => {
        const expiryTime = alert.expires ? new Date(alert.expires).getTime() : null;
        const endsTime = alert.ends ? new Date(alert.ends).getTime() : null;
        const limitTime = expiryTime || endsTime;
        return limitTime ? limitTime > now : true;
      });
    } catch {
      return [];
    }
  }, []);

  // Helper: Save cached alerts
  const saveCachedAlerts = useCallback((alertsList: WeatherAlert[]) => {
    try {
      localStorage.setItem(CACHED_NWS_ALERTS_KEY, JSON.stringify(alertsList));
    } catch (e) {
      console.error('Failed to cache NWS alerts:', e);
    }
  }, []);

  // Main fetch function
  const loadNWSAlerts = useCallback(
    async (force = false) => {
      // Clean skip if not US
      if (activeLocation.countryCode !== 'US') {
        setAlerts([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const rawAlerts = await fetchNWSAlerts(
          activeLocation.latitude,
          activeLocation.longitude,
          controller.signal
        );

        if (controller.signal.aborted) return;

        const now = new Date().getTime();

        // Filter alerts:
        // 1. Ignore test alerts (status === 'Test')
        // 2. Ignore cancelled alerts (messageType === 'Cancel')
        // 3. Ignore expired alerts (expiry time or end time in past)
        const activeAlerts = rawAlerts.filter((alert) => {
          if (alert.status === 'Test') return false;
          if (alert.messageType === 'Cancel') return false;

          const expiryTime = alert.expires ? new Date(alert.expires).getTime() : null;
          const endsTime = alert.ends ? new Date(alert.ends).getTime() : null;
          const limitTime = expiryTime || endsTime;
          
          if (limitTime && limitTime <= now) {
            return false;
          }
          return true;
        });

        // Cache the parsed active alerts
        saveCachedAlerts(activeAlerts);

        // Filter out locally dismissed alerts
        const activeDismissed = getActiveDismissedAlerts();
        const nonDismissedAlerts = activeAlerts.filter(
          (alert) => !activeDismissed.some((d) => d.id === alert.id)
        );

        // Sort alerts by severity (extreme > severe > moderate > minor > unknown)
        // and then earliest expiration when severity matches
        const severityWeight = {
          extreme: 5,
          severe: 4,
          moderate: 3,
          minor: 2,
          unknown: 1,
        };

        const sortedAlerts = nonDismissedAlerts.sort((a, b) => {
          const weightA = severityWeight[a.severity] || 1;
          const weightB = severityWeight[b.severity] || 1;

          if (weightA !== weightB) {
            return weightB - weightA; // Higher severity first
          }

          // Earliest expiration when severity matches
          const expA = a.expires ? new Date(a.expires).getTime() : Infinity;
          const expB = b.expires ? new Date(b.expires).getTime() : Infinity;
          return expA - expB;
        });

        setAlerts(sortedAlerts);
        setError(null);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;

        console.error('NWS alert fetch error, falling back to cached:', err);
        setError(err?.message || 'Failed to fetch National Weather Service alerts');

        // Fall back to cached alerts
        const cached = getCachedAlerts();
        const activeDismissed = getActiveDismissedAlerts();
        const nonDismissedCached = cached.filter(
          (alert) => !activeDismissed.some((d) => d.id === alert.id)
        );

        // Sort fallback cached alerts
        const sortedCached = nonDismissedCached.sort((a, b) => {
          const severityWeight = {
            extreme: 5,
            severe: 4,
            moderate: 3,
            minor: 2,
            unknown: 1,
          };
          const weightA = severityWeight[a.severity] || 1;
          const weightB = severityWeight[b.severity] || 1;

          if (weightA !== weightB) {
            return weightB - weightA;
          }

          const expA = a.expires ? new Date(a.expires).getTime() : Infinity;
          const expB = b.expires ? new Date(b.expires).getTime() : Infinity;
          return expA - expB;
        });

        setAlerts(sortedCached);
      } finally {
        setIsLoading(false);
      }
    },
    [activeLocation, getActiveDismissedAlerts, getCachedAlerts, saveCachedAlerts]
  );

  // Polling / immediate refresh
  useEffect(() => {
    loadNWSAlerts();

    // 10 minute polling
    const intervalId = setInterval(() => {
      // Refresh only if the document is active/visible
      if (document.visibilityState === 'visible') {
        loadNWSAlerts();
      }
    }, REFRESH_INTERVAL_MS);

    // Refresh immediately when document returns to visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNWSAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadNWSAlerts]);

  return {
    alerts,
    isLoading,
    error,
    dismissAlert,
    refreshAlerts: () => loadNWSAlerts(true),
  };
}
