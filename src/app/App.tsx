import { lazy, Suspense } from 'react';
import { AtmosphericBackground } from '../components/background/AtmosphericBackground';
import { ClockHeader } from '../components/header/ClockHeader';
import { WeatherHero } from '../features/weather/components/WeatherHero';
import { WeatherAlertBanner } from '../features/weather/components/WeatherAlertBanner';
import { NewsPanel } from '../features/news/components/NewsPanel';
import { MarketPanel } from '../features/markets/components/MarketPanel';
import { ContextBar } from '../components/common/ContextBar';
import { formatUvLabel } from '../features/weather/formatting';
import { useAmbientBriefController } from './useAmbientBriefController';

const DevTools = import.meta.env.DEV ? lazy(() => import('../components/common/DevTools')) : null;
const SettingsDrawer = lazy(() => import('../components/settings/SettingsDrawer').then((module) => ({ default: module.SettingsDrawer })));

export function App() {
  const dashboard = useAmbientBriefController();
  const weatherAvailable = dashboard.weatherState.status === 'loaded' || dashboard.weatherState.status === 'cached';
  const primaryAlert = dashboard.alerts[0];
  const uvIndex = dashboard.weatherData && Number.isFinite(dashboard.weatherData.uvIndex)
    ? dashboard.weatherData.uvIndex
    : null;

  return (
    <div className={`app-container min-h-screen w-full relative flex flex-col p-3 sm:p-5 lg:px-6 lg:py-5 min-[1600px]:px-7 max-w-[1440px] min-[1600px]:max-w-[1728px] min-[1900px]:max-w-[1880px] min-[2560px]:max-w-[2200px] min-[3440px]:max-w-[2400px] mx-auto gap-3.5 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 ${dashboard.settings.reducedMotion ? 'reduce-motion' : ''}`}>
      <AtmosphericBackground
        currentWeatherCondition={dashboard.weatherData?.condition}
        sunrise={dashboard.weatherData?.sunrise}
        sunset={dashboard.weatherData?.sunset}
        timezone={dashboard.settings.activeLocation?.timezone}
        isWeatherAvailable={weatherAvailable}
      />

      <ClockHeader
        onRefresh={dashboard.refreshAll}
        onOpenSettings={dashboard.openSettings}
        isRefreshing={dashboard.isRefreshing}
        globalStatus={dashboard.globalStatus}
        settingsBtnRef={dashboard.settingsButtonRef}
      />

      {dashboard.isDemoMode && (
        <div className="w-full bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between z-20 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold">Demo Data Active</span>
            <span className="text-amber-300/80">· Displaying simulated sample briefs and data across domains.</span>
          </div>
          <button type="button" onClick={() => dashboard.updateSettings({ isDemoMode: false })} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px] transition-colors shadow">
            Reset to Live Mode
          </button>
        </div>
      )}

      <main className={`ambient-grid ${primaryAlert ? 'has-alert' : ''} w-full flex-grow grid grid-cols-1 gap-3.5 z-10 items-stretch`}>
        {primaryAlert && (
          <div className="ambient-alert">
            <WeatherAlertBanner alert={primaryAlert} allAlerts={dashboard.alerts} onDismiss={() => dashboard.dismissAlert(primaryAlert.id)} onDismissAlert={dashboard.dismissAlert} />
          </div>
        )}
        <section className="ambient-weather flex flex-col" aria-label="Current weather and hourly forecast">
          <WeatherHero state={dashboard.weatherState} aqiState={dashboard.aqiState} onOpenSettings={dashboard.openSettings} onRetry={dashboard.refreshWeather} />
        </section>
        <section className="ambient-news flex flex-col" aria-label="Top news">
          <NewsPanel state={dashboard.newsState} onCustomize={dashboard.openSettings} onRetry={dashboard.refreshNews} />
        </section>
        <section className={`ambient-markets flex flex-col ${dashboard.settings.showMarkets ? '' : 'hidden'}`} aria-label="Markets">
          {dashboard.settings.showMarkets && <MarketPanel />}
        </section>
      </main>

      <ContextBar
        uvIndex={uvIndex}
        uvLabel={formatUvLabel(uvIndex)}
        sunset={dashboard.weatherData?.sunset ?? null}
        weatherFreshness={dashboard.weatherState.status === 'cached' ? 'Cached' : dashboard.weatherState.status === 'loaded' ? 'Live' : 'Unavailable'}
        aqiState={dashboard.aqiState}
      />
      {dashboard.isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsDrawer isOpen onClose={dashboard.closeSettings} triggerRef={dashboard.settingsButtonRef} />
        </Suspense>
      )}
      {DevTools && <Suspense fallback={null}><DevTools /></Suspense>}
    </div>
  );
}

export default App;
