import { useState, useRef, useEffect } from 'react';
import { AtmosphericBackground } from '../components/background/AtmosphericBackground';
import { ScreenWidthIndicator } from '../components/common/ScreenWidthIndicator';
import { DevStateSwitcher } from '../components/common/DevStateSwitcher';
import { ApiDiagnosticsDrawer } from '../components/common/ApiDiagnosticsDrawer';
import { useVisibilityRefresh } from '../hooks/useVisibilityRefresh';
import { useWeather } from '../features/weather/hooks/useWeather';
import { useNews } from '../features/news/hooks/useNews';
import { useMarkets } from '../features/markets/hooks/useMarkets';
import { ClockHeader } from '../components/header/ClockHeader';
import { WeatherHero } from '../components/weather/WeatherHero';
import { WeatherAlertBanner } from '../components/weather/WeatherAlertBanner';
import { NewsPanel } from '../components/news/NewsPanel';
import { MarketPanel } from '../components/markets/MarketPanel';
import { ContextBar } from '../components/context-bar/ContextBar';
import { SettingsDrawer } from '../components/settings/SettingsDrawer';
import { useSettingsStore } from '../lib/stores/useSettingsStore';
import { useDevStateStore } from '../lib/stores/useDevStateStore';
import { useNWSAlerts } from '../features/weather/hooks/useNWSAlerts';
import { useCurrencyStore } from '../lib/stores/useCurrencyStore';
import { useIslamicStore } from '../lib/stores/useIslamicStore';
import { getLocalDateComponents } from '../features/islamic/islamicService';
import {
  MOCK_WEATHER_ALERTS,
  CONTEXT_BAR_MOCK,
} from '../mocks/ambientData';

export function App() {
  const { settings, updateSettings } = useSettingsStore();
  const {
    weatherAlertVisible,
    weatherAlertSeverity,
    dismissWeatherAlert,
    setNewsStatus,
    setMarketStatus,
  } = useDevStateStore();

  const { weatherState, refreshWeather } = useWeather();
  const { newsState, refreshNews } = useNews();
  const { marketState, refreshMarkets } = useMarkets();
  const {
    alerts: nwsAlerts,
    dismissAlert: dismissNWSAlert,
    refreshAlerts: refreshNWSAlerts,
  } = useNWSAlerts();

  const { fetchExchangeRate } = useCurrencyStore();
  const { fetchSchedules, updateCountdown, todaySchedule } = useIslamicStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshWeather();
    refreshNWSAlerts();
    refreshNews();
    refreshMarkets();

    if (settings.currencyEnabled) {
      const [base, quote] = (settings.currencyPair || 'USD/BDT').split('/');
      if (base && quote) {
        fetchExchangeRate(base, quote, true);
      }
    }

    const activeLocation = settings.activeLocation;

    if (settings.islamic.enabled && activeLocation) {
      fetchSchedules(
        activeLocation.latitude,
        activeLocation.longitude,
        settings.islamic.calculationMethod,
        settings.islamic.asrMethod,
        true
      );
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };


  useVisibilityRefresh([
    {
      id: 'weather',
      isStale: () => true,
      refresh: async () => { refreshWeather(); },
    },
    {
      id: 'weatherAlerts',
      isStale: () => true,
      refresh: async () => { refreshNWSAlerts(); },
    },
    {
      id: 'news',
      isStale: () => true,
      refresh: async () => { refreshNews(); },
    },
    {
      id: 'markets',
      isStale: () => true,
      refresh: async () => { refreshMarkets(); },
    },
    {
      id: 'currency',
      isStale: () => true,
      refresh: async () => {
        if (settings.currencyEnabled) {
          const [base, quote] = (settings.currencyPair || 'USD/BDT').split('/');
          if (base && quote) {
            await fetchExchangeRate(base, quote);
          }
        }
      },
    },
    {
      id: 'islamic',
      isStale: () => true,
      refresh: async () => {
        const activeLocation = settings.activeLocation;
        if (settings.islamic.enabled && activeLocation) {
          await fetchSchedules(
            activeLocation.latitude,
            activeLocation.longitude,
            settings.islamic.calculationMethod,
            settings.islamic.asrMethod
          );
        }
      },
    },
  ]);

  useEffect(() => {
    const activeLocation = settings.activeLocation;
    if (settings.islamic.enabled && activeLocation) {
      fetchSchedules(
        activeLocation.latitude,
        activeLocation.longitude,
        settings.islamic.calculationMethod,
        settings.islamic.asrMethod
      );
    }
  }, [
    settings.islamic.enabled,
    settings.activeLocation?.latitude,
    settings.activeLocation?.longitude,
    settings.islamic.calculationMethod,
    settings.islamic.asrMethod,
    fetchSchedules,
  ]);

  useEffect(() => {
    updateCountdown();

    const interval = setInterval(() => {
      updateCountdown();

      const activeLocation = settings.activeLocation;
      if (settings.islamic.enabled && todaySchedule && activeLocation) {
        const timezone = todaySchedule.timezone;
        const currentComps = getLocalDateComponents(timezone, new Date());
        const currentStr = `${String(currentComps.day).padStart(2, '0')}-${String(currentComps.month).padStart(2, '0')}-${currentComps.year}`;

        if (currentStr !== todaySchedule.gregorianDate) {
          fetchSchedules(
            activeLocation.latitude,
            activeLocation.longitude,
            settings.islamic.calculationMethod,
            settings.islamic.asrMethod
          );
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [
    settings.islamic.enabled,
    todaySchedule,
    settings.activeLocation?.latitude,
    settings.activeLocation?.longitude,
    settings.islamic.calculationMethod,
    settings.islamic.asrMethod,
    updateCountdown,
    fetchSchedules,
  ]);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const hasRealAlerts = nwsAlerts && nwsAlerts.length > 0;
  const activeAlertsToShow = hasRealAlerts
    ? nwsAlerts
    : (settings.isDemoMode && weatherAlertVisible
      ? [MOCK_WEATHER_ALERTS[weatherAlertSeverity] || MOCK_WEATHER_ALERTS.warning]
      : []);

  const primaryAlert = activeAlertsToShow[0];

  const handleDismissAlert = (id: string) => {
    if (hasRealAlerts) {
      dismissNWSAlert(id, nwsAlerts.find((a) => a.id === id)?.expires);
    } else {
      dismissWeatherAlert();
    }
  };

  return (
    <div className="app-container min-h-screen w-full relative flex flex-col justify-between p-3 sm:p-5 lg:p-6 min-[1600px]:p-7 max-w-[1440px] min-[1600px]:max-w-[1728px] min-[1900px]:max-w-[1880px] min-[2560px]:max-w-[2200px] min-[3440px]:max-w-[2400px] mx-auto gap-3.5 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dark Atmospheric Full-Screen Background */}
      <AtmosphericBackground
        currentWeatherCondition={
          weatherState.status === 'loaded' || weatherState.status === 'cached'
            ? weatherState.data.condition
            : undefined
        }
        sunrise={
          weatherState.status === 'loaded' || weatherState.status === 'cached'
            ? weatherState.data.sunrise
            : undefined
        }
        sunset={
          weatherState.status === 'loaded' || weatherState.status === 'cached'
            ? weatherState.data.sunset
            : undefined
        }
        timezone={settings.activeLocation?.timezone}
        isWeatherAvailable={weatherState.status === 'loaded' || weatherState.status === 'cached'}
      />

      {/* Lightweight Top Header */}
      <ClockHeader
        onRefresh={handleRefresh}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefreshing}
        settingsBtnRef={settingsBtnRef}
      />

      {/* Persistent Visible Demo Data Banner (Development Only) */}
      {settings.isDemoMode && import.meta.env.DEV && (
        <div className="w-full bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between z-20 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold">Demo Data Active</span>
            <span className="text-amber-300/80">· Displaying simulated sample briefs and data across domains.</span>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ isDemoMode: false })}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px] transition-colors shadow"
          >
            Reset to Live Mode
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full flex-grow grid grid-cols-1 lg:grid-cols-12 min-[1900px]:grid-cols-12 gap-3.5 z-10 items-stretch">
        {/* Active Severe Weather Alert Banner */}
        {primaryAlert && (
          <div className="col-span-12">
            <WeatherAlertBanner
              alert={primaryAlert}
              allAlerts={activeAlertsToShow}
              onDismiss={() => handleDismissAlert(primaryAlert.id)}
              onDismissAlert={handleDismissAlert}
            />
          </div>
        )}

        {/* Weather Hero Card */}
        <div
          className={
            settings.showMarkets
              ? 'col-span-12 min-[1900px]:col-span-4 flex flex-col'
              : 'col-span-12 min-[1900px]:col-span-5 flex flex-col'
          }
        >
          <WeatherHero
            state={weatherState}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRetry={refreshWeather}
          />
        </div>

        {/* News Panel */}
        <div
          className={
            settings.showMarkets
              ? 'col-span-12 lg:col-span-7 min-[1900px]:col-span-5 flex flex-col'
              : 'col-span-12 lg:col-span-12 min-[1900px]:col-span-7 flex flex-col'
          }
        >
          <NewsPanel
            state={newsState}
            onCustomize={() => setIsSettingsOpen(true)}
            onRetry={() => setNewsStatus('loaded')}
            onUseCached={() => setNewsStatus('cached')}
          />
        </div>

        {/* Right Column: Markets & Context */}
        <div className={`col-span-12 flex flex-col gap-3.5 ${
            settings.showMarkets
              ? 'lg:col-span-5 min-[1900px]:col-span-3'
              : 'hidden min-[1900px]:flex min-[1900px]:col-span-3'
          }`}>
          
          {settings.showMarkets && (
            <MarketPanel
              state={marketState}
              onRetry={() => setMarketStatus('loaded')}
              onRefresh={refreshMarkets}
            />
          )}

          {/* ContextBar goes here on ultrawide */}
          <div className="hidden min-[1900px]:block">
             <ContextBar data={CONTEXT_BAR_MOCK} />
          </div>
        </div>
      </main>

      {/* Slim Contextual Information Ribbon at Bottom for standard screens */}
      <div className="min-[1900px]:hidden">
        <ContextBar data={CONTEXT_BAR_MOCK} />
      </div>

      {/* Settings Preferences Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        triggerRef={settingsBtnRef}
      />

      {/* Development Screen Width & Viewport Indicator */}
      <ScreenWidthIndicator />

      {/* Developer State Switcher for Visual State Previewing */}
      <DevStateSwitcher />

      {/* Developer API Diagnostics Panel */}
      <ApiDiagnosticsDrawer />
    </div>
  );
}

export default App;
