import React from 'react';
import { CloudSun, ShieldAlert, MapPinOff, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { WeatherInsight } from './WeatherInsight';
import { HourlyForecast } from './HourlyForecast';
import { WeatherHeroSkeleton } from './WeatherHeroSkeleton';
import { WeatherState } from '../model';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAirQuality } from '../../air-quality/hooks/useAirQuality';
import { interpretAqi } from '../../air-quality/utils/aqiInterpreter';
import { formatTemperature } from '../../../lib/formatting';

interface WeatherHeroProps {
  state: WeatherState;
  onOpenSettings?: () => void;
  onRetry?: () => void;
}

export const WeatherHero: React.FC<WeatherHeroProps> = ({
  state,
  onOpenSettings,
  onRetry,
}) => {
  const { settings } = useSettingsStore();
  const { aqiState } = useAirQuality();

  const isCompact = settings.contentDensity === 'compact';

  const formatTemp = (value: number) => formatTemperature(value, settings.temperatureUnit, false);

  // 1. Loading state
  if (state.status === 'loading') {
    return <WeatherHeroSkeleton />;
  }

  // 2. Location Permission Denied state
  if (state.status === 'permission_denied') {
    return (
      <GlassSurface
        className={`${isCompact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 lg:p-7'} flex flex-col justify-center items-center text-center gap-4 w-full min-h-[200px] border-amber-500/30 bg-amber-950/20`}
      >
        <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <h2 className="text-lg font-bold text-slate-100">Location permission denied</h2>
          <p className="text-xs text-slate-300">
            {state.message ||
              'Weather information requires location access. You can enter a location manually in Settings or grant browser permission.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
          >
            Enter location
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      </GlassSurface>
    );
  }

  // 3. Location Unavailable state
  if (state.status === 'location_unavailable') {
    return (
      <GlassSurface
        className={`${isCompact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 lg:p-7'} flex flex-col justify-center items-center text-center gap-4 w-full min-h-[200px] border-slate-700/50`}
      >
        <div className="p-3 rounded-full bg-slate-800 text-slate-300 border border-white/10">
          <MapPinOff className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <h2 className="text-lg font-bold text-slate-100">Location unavailable</h2>
          <p className="text-xs text-slate-300">
            {state.message ||
              'Unable to retrieve weather data for the specified location. Please check your internet connection or update location.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md"
          >
            Enter location
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      </GlassSurface>
    );
  }

  // 4. Loaded or Cached state
  const weatherData = state.data;
  const isCached = state.status === 'cached';

  const showAqiProminent =
    (aqiState.status === 'loaded' || aqiState.status === 'cached') &&
    aqiState.data.usAqi !== null &&
    aqiState.data.usAqi >= 101;

  const aqiVal = showAqiProminent && 'data' in aqiState ? aqiState.data.usAqi : null;
  const interpretation = aqiVal !== null ? interpretAqi(aqiVal) : null;

  return (
    <GlassSurface
      className={`weather-hero-card ${
        isCompact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 lg:p-7'
      } flex flex-col justify-between gap-4 sm:gap-5 w-full h-full relative`}
    >
      {/* Cached Banner Indicator */}
      {isCached && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950/70 border border-amber-700/40 text-amber-200 text-[11px] font-sans font-medium w-fit">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{state.lastUpdatedText || 'Showing cached weather · Last updated 1 hour ago'}</span>
        </div>
      )}

      {/* Upper Row: Main Temp, Condition, Stats, Insight */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Huge temperature + condition + feels like */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="text-6xl sm:text-7xl lg:text-8xl font-extralight tracking-tight text-white font-mono leading-none shrink-0">
            {formatTemp(weatherData.temperature)}
          </div>

          <div className="flex flex-col gap-1 border-l border-white/10 pl-4 sm:pl-5">
            <div className="flex items-center gap-2 text-xl sm:text-2xl font-medium text-slate-100">
              <CloudSun className="w-6 h-6 text-amber-300 shrink-0" aria-hidden="true" />
              <span>{weatherData.condition}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-300 font-sans">
              <span>Feels {formatTemp(weatherData.feelsLike)}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-200">
                H {formatTemp(weatherData.high)} · L {formatTemp(weatherData.low)}
              </span>
            </div>
          </div>
        </div>

        {/* Insight and AQI */}
        <div className="flex flex-col items-start lg:items-end justify-center gap-2 mt-2 lg:mt-0">
          {weatherData.summaryNote && <WeatherInsight note={weatherData.summaryNote} />}
          {showAqiProminent && interpretation && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${interpretation.bgClass} border border-white/10 ${interpretation.textClass} text-xs font-semibold`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AQI {aqiVal} · {interpretation.label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-white/10 my-1" />

      {/* Hourly Forecast Timeline */}
      <div className="hourly-forecast-container w-full">
        <HourlyForecast hourly={weatherData.hourly} />
      </div>
    </GlassSurface>
  );
};
