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
    <div className={`app-shell min-h-[100dvh] w-full overflow-x-clip text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 ${dashboard.settings.reducedMotion ? 'reduce-motion' : ''}`}>
      <AtmosphericBackground
        currentWeatherCondition={dashboard.weatherData?.condition}
        sunrise={dashboard.weatherData?.sunrise}
        sunset={dashboard.weatherData?.sunset}
        timezone={dashboard.settings.activeLocation?.timezone}
        isWeatherAvailable={weatherAvailable}
      />

      <div className="app-container">
        {dashboard.isDemoMode && (
          <div className="ambient-demo w-full bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between z-20 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-semibold shrink-0">Demo Data Active</span>
              <span className="text-amber-300/80 truncate">· Displaying simulated sample briefs and data across domains.</span>
            </div>
            <button type="button" onClick={() => dashboard.updateSettings({ isDemoMode: false })} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px] transition-colors shadow shrink-0">
              Reset to Live Mode
            </button>
          </div>
        )}

        <main className={`ambient-grid ${primaryAlert ? 'has-alert' : ''}`}>
          <ClockHeader
            onRefresh={dashboard.refreshAll}
            onOpenSettings={dashboard.openSettings}
            isRefreshing={dashboard.isRefreshing}
            globalStatus={dashboard.globalStatus}
            settingsBtnRef={dashboard.settingsButtonRef}
          />
          {primaryAlert && (
            <div className="ambient-alert">
              <WeatherAlertBanner alert={primaryAlert} allAlerts={dashboard.alerts} onDismiss={() => dashboard.dismissAlert(primaryAlert.id)} onDismissAlert={dashboard.dismissAlert} />
            </div>
          )}
          <section className="ambient-weather" aria-label="Current weather and hourly forecast">
            <WeatherHero state={dashboard.weatherState} aqiState={dashboard.aqiState} onOpenSettings={dashboard.openSettings} onRetry={dashboard.refreshWeather} />
          </section>
          <section className="ambient-news" aria-label="Top news">
            <NewsPanel state={dashboard.newsState} onCustomize={dashboard.openSettings} onRetry={dashboard.refreshNews} />
          </section>
          <section className={`ambient-markets ${dashboard.settings.showMarkets ? '' : 'hidden'}`} aria-label="Markets">
            {dashboard.settings.showMarkets && <MarketPanel />}
          </section>
          <ContextBar
            uvIndex={uvIndex}
            uvLabel={formatUvLabel(uvIndex)}
            sunset={dashboard.weatherData?.sunset ?? null}
            weatherFreshness={dashboard.weatherState.status === 'cached' ? 'Cached' : dashboard.weatherState.status === 'loaded' ? 'Live' : 'Unavailable'}
            aqiState={dashboard.aqiState}
          />
        </main>

        {dashboard.isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsDrawer isOpen onClose={dashboard.closeSettings} triggerRef={dashboard.settingsButtonRef} />
          </Suspense>
        )}
        {DevTools && <Suspense fallback={null}><DevTools /></Suspense>}
      </div>
    </div>
  );
}

export default App;
