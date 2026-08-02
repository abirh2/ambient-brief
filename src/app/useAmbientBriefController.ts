import { useCallback, useEffect, useRef, useState } from 'react';
import { useVisibilityRefresh } from '../hooks/useVisibilityRefresh';
import { useWeather } from '../features/weather/hooks/useWeather';
import { useNews } from '../features/news/hooks/useNews';
import { useMarkets } from '../features/markets/hooks/useMarkets';
import { useNWSAlerts } from '../features/weather/hooks/useNWSAlerts';
import { useAirQuality } from '../features/air-quality/hooks/useAirQuality';
import { useSettingsStore } from '../stores/settingsStore';
import { useDevStateStore } from '../stores/devStateStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useIslamicStore } from '../stores/prayerTimesStore';
import { getLocalDateComponents } from '../features/prayer-times/service';
import { MOCK_WEATHER_ALERTS } from '../mocks/ambientData';

export function useAmbientBriefController() {
  const { settings, updateSettings } = useSettingsStore();
  const { weatherAlertVisible, weatherAlertSeverity, dismissWeatherAlert } = useDevStateStore();
  const { weatherState, refreshWeather } = useWeather();
  const { newsState, refreshNews } = useNews();
  const { marketState, refreshMarkets } = useMarkets();
  const { alerts: nwsAlerts, dismissAlert: dismissNWSAlert, refreshAlerts: refreshNWSAlerts } = useNWSAlerts();
  const { aqiState, refreshAirQuality } = useAirQuality();
  const { fetchExchangeRate } = useCurrencyStore();
  const { fetchSchedules, updateCountdown, todaySchedule } = useIslamicStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const refreshOptionalData = useCallback(async (force = false) => {
    if (settings.currencyEnabled) {
      const [base, quote] = settings.currencyPair.split('/');
      if (base && quote) await fetchExchangeRate(base, quote, force);
    }
    const location = settings.activeLocation;
    if (settings.islamic.enabled && location) {
      await fetchSchedules(
        location.latitude,
        location.longitude,
        settings.islamic.calculationMethod,
        settings.islamic.asrMethod,
        force,
      );
    }
  }, [fetchExchangeRate, fetchSchedules, settings]);

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    refreshWeather();
    refreshAirQuality();
    refreshNWSAlerts();
    refreshNews();
    refreshMarkets();
    void refreshOptionalData(true);
    window.setTimeout(() => setIsRefreshing(false), 600);
  }, [refreshAirQuality, refreshMarkets, refreshNews, refreshNWSAlerts, refreshOptionalData, refreshWeather]);

  useVisibilityRefresh([
    { id: 'weather', isStale: () => true, refresh: async () => refreshWeather() },
    { id: 'weatherAlerts', isStale: () => true, refresh: async () => refreshNWSAlerts() },
    { id: 'news', isStale: () => true, refresh: async () => refreshNews() },
    { id: 'markets', isStale: () => true, refresh: async () => refreshMarkets() },
    { id: 'optional', isStale: () => true, refresh: () => refreshOptionalData() },
  ]);

  useEffect(() => {
    const location = settings.activeLocation;
    if (settings.islamic.enabled && location) {
      void fetchSchedules(
        location.latitude,
        location.longitude,
        settings.islamic.calculationMethod,
        settings.islamic.asrMethod,
      );
    }
  }, [fetchSchedules, settings.activeLocation, settings.islamic]);

  useEffect(() => {
    const updatePrayerState = () => {
      updateCountdown();
      const location = settings.activeLocation;
      if (!settings.islamic.enabled || !todaySchedule || !location) return;
      const current = getLocalDateComponents(todaySchedule.timezone, new Date());
      const date = `${String(current.day).padStart(2, '0')}-${String(current.month).padStart(2, '0')}-${current.year}`;
      if (date !== todaySchedule.gregorianDate) {
        void fetchSchedules(
          location.latitude,
          location.longitude,
          settings.islamic.calculationMethod,
          settings.islamic.asrMethod,
        );
      }
    };
    updatePrayerState();
    const interval = window.setInterval(updatePrayerState, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchSchedules, settings.activeLocation, settings.islamic, todaySchedule, updateCountdown]);

  useEffect(() => {
    const openSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', openSettings);
    return () => window.removeEventListener('open-settings', openSettings);
  }, []);

  const hasLiveAlerts = nwsAlerts.length > 0;
  const isDemoMode = import.meta.env.DEV && settings.isDemoMode;
  const alerts = hasLiveAlerts
    ? nwsAlerts
    : isDemoMode && weatherAlertVisible
      ? [MOCK_WEATHER_ALERTS[weatherAlertSeverity] ?? MOCK_WEATHER_ALERTS.warning]
      : [];
  const weatherData = weatherState.status === 'loaded' || weatherState.status === 'cached'
    ? weatherState.data
    : null;

  const dismissAlert = (id: string) => {
    if (hasLiveAlerts) dismissNWSAlert(id, nwsAlerts.find((alert) => alert.id === id)?.expires);
    else dismissWeatherAlert();
  };

  return {
    settings,
    updateSettings,
    weatherState,
    weatherData,
    aqiState,
    newsState,
    marketState,
    alerts,
    dismissAlert,
    refreshAll,
    refreshWeather,
    refreshNews,
    refreshMarkets,
    isDemoMode,
    isRefreshing,
    isSettingsOpen,
    openSettings: () => setIsSettingsOpen(true),
    closeSettings: () => setIsSettingsOpen(false),
    settingsButtonRef,
  };
}
