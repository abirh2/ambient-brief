import { useCallback, useEffect, useRef, useState } from 'react';
import { useWeather } from '../features/weather/hooks/useWeather';
import { useNews } from '../features/news/hooks/useNews';
import { useNWSAlerts } from '../features/weather/hooks/useNWSAlerts';
import { useAirQuality } from '../features/air-quality/hooks/useAirQuality';
import { useSettingsStore } from '../stores/settingsStore';
import { useDevStateStore } from '../stores/devStateStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useIslamicStore } from '../stores/prayerTimesStore';
import { useMarkets } from '../features/markets/hooks/useMarkets';
import { getLocalDateComponents } from '../features/prayer-times/service';
import { MOCK_WEATHER_ALERTS } from '../mocks/ambientData';
import {
  RefreshCoordinator,
  type RefreshProviderId,
  type RefreshSummary,
} from './refreshCoordinator';

export interface GlobalRefreshStatus {
  state: 'online' | 'offline' | 'refreshing' | 'cached' | 'partial';
  label: string;
}

export function useAmbientBriefController() {
  const { settings, updateSettings } = useSettingsStore();
  const { weatherAlertVisible, weatherAlertSeverity, dismissWeatherAlert } = useDevStateStore();
  const weather = useWeather();
  const news = useNews();
  const nws = useNWSAlerts();
  const airQuality = useAirQuality();
  const currency = useCurrencyStore();
  const islamic = useIslamicStore();
  const { marketState, loadMarkets, clearMarketCache, isMarketStale } = useMarkets();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  const [manualSummary, setManualSummary] = useState<RefreshSummary | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const latest = useRef({ settings, weather, news, nws, airQuality, currency, islamic, marketState, loadMarkets, isMarketStale });
  latest.current = { settings, weather, news, nws, airQuality, currency, islamic, marketState, loadMarkets, isMarketStale };

  const coordinatorRef = useRef<RefreshCoordinator | null>(null);
  if (!coordinatorRef.current) {
    coordinatorRef.current = new RefreshCoordinator({
      // This order is the product's load contract. Markets fetch only the public generated snapshot.
      providers: [
        {
          id: 'weather', enabled: () => true,
          isStale: () => latest.current.weather.isWeatherStale(),
          refresh: ({ force, signal }) => latest.current.weather.loadWeather(force, signal),
        },
        {
          id: 'airQuality', enabled: () => true,
          isStale: () => latest.current.airQuality.isAirQualityStale(),
          refresh: ({ force, signal }) => latest.current.airQuality.loadAirQuality(force, signal),
        },
        {
          id: 'alerts',
          enabled: () => latest.current.settings.activeLocation?.countryCode.toUpperCase() === 'US',
          isStale: () => latest.current.nws.isAlertsStale(),
          refresh: ({ force, signal }) => latest.current.nws.refreshAlerts(force, signal),
        },
        {
          id: 'prayerTimes',
          enabled: () => latest.current.settings.islamic.enabled && Boolean(latest.current.settings.activeLocation),
          isStale: () => isPrayerScheduleStale(latest.current.islamic.todaySchedule, latest.current.islamic.isStale),
          refresh: async ({ force, signal }) => {
            const currentSettings = latest.current.settings;
            const location = currentSettings.activeLocation;
            if (!location || !currentSettings.islamic.enabled) return 'skipped';
            const result = await latest.current.islamic.fetchSchedules(
              location.latitude,
              location.longitude,
              currentSettings.islamic.calculationMethod,
              currentSettings.islamic.asrMethod,
              force,
              signal,
            );
            return result || Promise.reject(new Error('Prayer times unavailable'));
          },
        },
        {
          id: 'currency',
          enabled: () => latest.current.settings.currencyEnabled,
          isStale: () => latest.current.currency.isStale || !latest.current.currency.rate,
          refresh: async ({ force, signal }) => {
            const [base, quote] = latest.current.settings.currencyPair.split('/');
            if (!base || !quote) return 'skipped';
            const result = await latest.current.currency.fetchExchangeRate(base, quote, force, signal);
            return result || Promise.reject(new Error('Currency unavailable'));
          },
        },
        {
          id: 'news', enabled: () => true,
          isStale: () => latest.current.news.isNewsStale(),
          refresh: ({ force, signal }) => latest.current.news.loadNews(force, signal),
        },
        {
          id: 'markets', enabled: () => latest.current.settings.showMarkets,
          isStale: () => latest.current.isMarketStale(),
          refresh: ({ force, signal }) => latest.current.loadMarkets(force, signal),
        },
      ],
    });
  }
  const coordinator = coordinatorRef.current;

  useEffect(() => {
    void coordinator.start();
    const handleOffline = () => {
      setIsOnline(false);
      coordinator.handleOffline();
    };
    const handleOnline = () => {
      setIsOnline(true);
      void coordinator.handleOnline();
    };
    const handleVisibility = () => void coordinator.handleVisibilityChange();
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      coordinator.stop();
    };
  }, [coordinator]);

  const settingsFingerprint = getSettingsFingerprint(settings);
  const previousSettingsFingerprintRef = useRef(settingsFingerprint);
  useEffect(() => {
    const previous = previousSettingsFingerprintRef.current;
    previousSettingsFingerprintRef.current = settingsFingerprint;
    const changed = changedProviders(previous, settingsFingerprint);
    if (changed.length > 0) void coordinator.settingsChanged(changed);
  }, [coordinator, settingsFingerprint]);

  const updateCountdown = islamic.updateCountdown;
  useEffect(() => {
    const updatePrayerCountdown = () => updateCountdown();
    updatePrayerCountdown();
    const interval = window.setInterval(updatePrayerCountdown, 60_000);
    return () => window.clearInterval(interval);
  }, [updateCountdown]);

  useEffect(() => {
    const openSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', openSettings);
    return () => window.removeEventListener('open-settings', openSettings);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setManualSummary(await coordinator.manualRefresh());
    } finally {
      setIsRefreshing(false);
    }
  }, [coordinator]);

  const refreshProvider = useCallback((providerId: RefreshProviderId) => {
    void coordinator.settingsChanged([providerId]);
  }, [coordinator]);

  const refreshMarkets = useCallback(() => {
    void loadMarkets(true).catch(() => undefined);
  }, [loadMarkets]);

  const hasLiveAlerts = nws.alerts.length > 0;
  const isDemoMode = import.meta.env.DEV && settings.isDemoMode;
  const alerts = hasLiveAlerts
    ? nws.alerts
    : isDemoMode && weatherAlertVisible
      ? [MOCK_WEATHER_ALERTS[weatherAlertSeverity] ?? MOCK_WEATHER_ALERTS.warning]
      : [];
  const weatherData = weather.weatherState.status === 'loaded' || weather.weatherState.status === 'cached'
    ? weather.weatherState.data
    : null;

  const dismissAlert = (id: string) => {
    if (hasLiveAlerts) {
      const alert = nws.alerts.find((candidate) => candidate.id === id);
      nws.dismissAlert(id, alert?.expires ?? alert?.ends);
    } else dismissWeatherAlert();
  };

  const hasCachedData = weather.weatherState.status === 'cached'
    || airQuality.aqiState.status === 'cached'
    || news.newsState.status === 'cached'
    || marketState.status === 'cached'
    || marketState.status === 'stale'
    || currency.isStale
    || islamic.isStale;
  const globalStatus = getGlobalStatus(isOnline, isRefreshing, hasCachedData, manualSummary);

  return {
    settings,
    updateSettings,
    weatherState: weather.weatherState,
    weatherData,
    aqiState: airQuality.aqiState,
    newsState: news.newsState,
    marketState,
    alerts,
    dismissAlert,
    refreshAll,
    refreshWeather: () => refreshProvider('weather'),
    refreshNews: () => refreshProvider('news'),
    refreshMarkets,
    clearMarketCache,
    isDemoMode,
    isRefreshing,
    globalStatus,
    isSettingsOpen,
    openSettings: () => setIsSettingsOpen(true),
    closeSettings: () => setIsSettingsOpen(false),
    settingsButtonRef,
  };
}

interface SettingsFingerprint {
  location: string;
  temperatureUnit: string;
  newsCategories: string;
  currency: string;
  prayer: string;
  markets: string;
}

function getSettingsFingerprint(settings: ReturnType<typeof useSettingsStore.getState>['settings']): SettingsFingerprint {
  const location = settings.activeLocation;
  const locationKey = location
    ? `${location.id}:${location.latitude}:${location.longitude}:${location.countryCode}:${location.timezone}`
    : 'none';
  return {
    location: locationKey,
    temperatureUnit: settings.temperatureUnit,
    newsCategories: [...settings.newsCategories].sort().join(','),
    currency: `${settings.currencyEnabled}:${settings.currencyPair}`,
    prayer: `${settings.islamic.enabled}:${settings.islamic.calculationMethod}:${settings.islamic.asrMethod}`,
    markets: String(settings.showMarkets),
  };
}

function changedProviders(previous: SettingsFingerprint, next: SettingsFingerprint): RefreshProviderId[] {
  const changed = new Set<RefreshProviderId>();
  if (previous.location !== next.location) {
    changed.add('weather');
    changed.add('airQuality');
    changed.add('alerts');
    changed.add('prayerTimes');
  }
  if (previous.temperatureUnit !== next.temperatureUnit) changed.add('weather');
  if (previous.newsCategories !== next.newsCategories) changed.add('news');
  if (previous.currency !== next.currency) changed.add('currency');
  if (previous.prayer !== next.prayer) changed.add('prayerTimes');
  if (previous.markets !== next.markets) changed.add('markets');
  return [...changed];
}

function isPrayerScheduleStale(
  schedule: ReturnType<typeof useIslamicStore.getState>['todaySchedule'],
  storedAsStale: boolean,
): boolean {
  if (!schedule || storedAsStale) return true;
  const current = getLocalDateComponents(schedule.timezone, new Date());
  const currentDate = `${String(current.day).padStart(2, '0')}-${String(current.month).padStart(2, '0')}-${current.year}`;
  return currentDate !== schedule.gregorianDate;
}

function getGlobalStatus(
  online: boolean,
  refreshing: boolean,
  hasCachedData: boolean,
  manualSummary: RefreshSummary | null,
): GlobalRefreshStatus {
  if (!online) return { state: 'offline', label: 'Offline · cached data' };
  if (refreshing) return { state: 'refreshing', label: 'Refreshing' };
  if (manualSummary && (manualSummary.failed.length > 0 || manualSummary.cached.length > 0)) {
    const refreshed = manualSummary.succeeded.length;
    const attempted = refreshed + manualSummary.cached.length + manualSummary.failed.length;
    return { state: 'partial', label: `${refreshed}/${attempted} refreshed` };
  }
  if (hasCachedData) return { state: 'cached', label: 'Online · cached data' };
  return { state: 'online', label: 'Online' };
}
