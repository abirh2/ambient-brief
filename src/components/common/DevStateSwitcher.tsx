import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Layers, ShieldAlert, Moon, CloudSun, Activity } from 'lucide-react';
import { useDevStateStore } from '../../lib/stores/useDevStateStore';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useDiagnosticsStore } from '../../lib/api/diagnosticsStore';
import { WeatherStateStatus, NewsStateStatus, MarketStateStatus, AlertSeverity, TimeOfDayVariant, WeatherEffectVariant } from '../../lib/types';

export const DevStateSwitcher: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    weatherStatus,
    newsStatus,
    marketStatus,
    weatherAlertVisible,
    weatherAlertSeverity,
    bgTimeOfDayOverride,
    bgWeatherOverride,
    setWeatherStatus,
    setNewsStatus,
    setMarketStatus,
    restoreWeatherAlert,
    dismissWeatherAlert,
    setWeatherAlertSeverity,
    setBgTimeOfDayOverride,
    setBgWeatherOverride,
    setAllPreset,
  } = useDevStateStore();

  const { settings, updateSettings } = useSettingsStore();

  return (
    <aside
      aria-label="Developer visual state preview toolbar"
      className="fixed bottom-3 right-3 z-50 flex flex-col items-end font-sans text-xs"
    >
      {/* Expanded Control Box */}
      {isExpanded && (
        <div className="mb-2 w-80 p-3.5 rounded-xl bg-slate-950/95 border border-indigo-500/30 shadow-2xl text-slate-200 backdrop-blur-xl flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-400">
              <Layers className="w-4 h-4" />
              <span>Dev State Preview Switcher</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setAllPreset('loaded')}
                className="px-2 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-700/50 text-[11px] font-semibold transition-colors"
              >
                All Loaded
              </button>
              <button
                type="button"
                onClick={() => setAllPreset('loading')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] font-semibold transition-colors"
              >
                All Loading
              </button>
              <button
                type="button"
                onClick={() => setAllPreset('error_unavailable')}
                className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-700/50 text-[11px] font-semibold transition-colors"
              >
                Errors &amp; Unavail
              </button>
              <button
                type="button"
                onClick={() => setAllPreset('cached')}
                className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-700/50 text-[11px] font-semibold transition-colors"
              >
                Cached &amp; Delayed
              </button>
            </div>
          </div>

          {/* Atmospheric Background Preview Controls */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-sky-950/30 border border-sky-500/30">
            <span className="font-semibold text-sky-200 text-[11px] flex items-center gap-1">
              <CloudSun className="w-3.5 h-3.5 text-sky-400" />
              Atmospheric Background:
            </span>

            {/* Time of Day */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">Time of Day:</span>
              <select
                value={bgTimeOfDayOverride}
                onChange={(e) => setBgTimeOfDayOverride(e.target.value as 'auto' | TimeOfDayVariant)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-sky-500/30 text-xs font-mono text-sky-300 focus:outline-none"
              >
                <option value="auto">Auto (System)</option>
                <option value="morning">Morning</option>
                <option value="day">Day</option>
                <option value="sunset">Sunset</option>
                <option value="night">Night</option>
              </select>
            </div>

            {/* Weather Effect */}
            <div className="flex items-center justify-between pt-1 border-t border-sky-500/20">
              <span className="text-[11px] text-slate-300">Weather Effect:</span>
              <select
                value={bgWeatherOverride}
                onChange={(e) => setBgWeatherOverride(e.target.value as 'auto' | WeatherEffectVariant)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-sky-500/30 text-xs font-mono text-sky-300 focus:outline-none"
              >
                <option value="auto">Auto (Weather)</option>
                <option value="clear">Clear</option>
                <option value="cloudy">Cloudy</option>
                <option value="rain">Rain</option>
                <option value="snow">Snow</option>
                <option value="storm">Storm</option>
                <option value="fog">Fog</option>
              </select>
            </div>

            {/* Motion Setting */}
            <div className="flex items-center justify-between pt-1 border-t border-sky-500/20">
              <span className="text-[11px] text-slate-300">Motion Level:</span>
              <select
                value={settings.backgroundMotion}
                onChange={(e) =>
                  updateSettings({ backgroundMotion: e.target.value as 'living' | 'subtle' | 'static' })
                }
                className="px-2 py-0.5 rounded bg-slate-900 border border-sky-500/30 text-xs font-mono text-sky-300 focus:outline-none"
              >
                <option value="living">Living</option>
                <option value="subtle">Subtle</option>
                <option value="static">Static</option>
              </select>
            </div>
          </div>

          {/* Islamic Module Quick Toggle */}
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-200 text-[11px] flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Islamic Info:
              </span>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    islamic: { ...settings.islamic, enabled: !settings.islamic.enabled },
                  })
                }
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  settings.islamic.enabled
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 border border-white/10 hover:text-slate-200'
                }`}
              >
                {settings.islamic.enabled ? 'Enabled' : 'Disabled (Default)'}
              </button>
            </div>

            {settings.islamic.enabled && (
              <div className="flex items-center justify-between pt-1 border-t border-indigo-500/20">
                <span className="text-[11px] text-slate-300">Full Schedule:</span>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({
                      islamic: {
                        ...settings.islamic,
                        showFullSchedule: !settings.islamic.showFullSchedule,
                      },
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    settings.islamic.showFullSchedule
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {settings.islamic.showFullSchedule ? 'Shown' : 'Hidden'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-orange-950/30 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-orange-200 text-[11px] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                Severe Alert Mock:
              </span>
              <button
                type="button"
                onClick={weatherAlertVisible ? dismissWeatherAlert : restoreWeatherAlert}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  weatherAlertVisible
                    ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 hover:bg-orange-500/30'
                    : 'bg-slate-800 text-slate-400 border border-white/10 hover:text-slate-200'
                }`}
              >
                {weatherAlertVisible ? 'Visible (Dismiss)' : 'Dismissed (Restore)'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-orange-500/20">
              <span className="text-[11px] text-slate-300">Level:</span>
              <select
                value={weatherAlertSeverity}
                onChange={(e) => setWeatherAlertSeverity(e.target.value as AlertSeverity)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-orange-500/30 text-xs font-mono text-orange-300 focus:outline-none"
              >
                <option value="warning">Warning (Demonstrated)</option>
                <option value="watch">Watch</option>
                <option value="advisory">Advisory</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Module Selectors */}
          <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300 text-[11px]">Weather State:</span>
              <select
                value={weatherStatus}
                onChange={(e) => setWeatherStatus(e.target.value as WeatherStateStatus)}
                className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-xs font-mono text-indigo-300 focus:outline-none"
              >
                <option value="loaded">Loaded</option>
                <option value="loading">Loading (Skeleton)</option>
                <option value="permission_denied">Permission Denied</option>
                <option value="location_unavailable">Location Unavail</option>
                <option value="cached">Cached Weather</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300 text-[11px]">News State:</span>
              <select
                value={newsStatus}
                onChange={(e) => setNewsStatus(e.target.value as NewsStateStatus)}
                className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-xs font-mono text-indigo-300 focus:outline-none"
              >
                <option value="loaded">Loaded</option>
                <option value="loading">Loading (Skeleton)</option>
                <option value="empty">Empty</option>
                <option value="error">Error</option>
                <option value="cached">Cached News</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300 text-[11px]">Market State:</span>
              <select
                value={marketStatus}
                onChange={(e) => setMarketStatus(e.target.value as MarketStateStatus)}
                className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-xs font-mono text-indigo-300 focus:outline-none"
              >
                <option value="loaded">Loaded</option>
                <option value="loading">Loading (Skeleton)</option>
                <option value="cached">Cached</option>
                <option value="stale">Stale</option>
                <option value="partial">Partial</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => useDiagnosticsStore.getState().toggleDrawer()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-colors font-medium text-xs cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open API Diagnostics Panel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 shadow-lg backdrop-blur-md transition-all font-mono text-[11px] font-semibold cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
        <span>Dev States</span>
        <span className="px-1.5 py-0.2 rounded bg-indigo-800/60 text-[10px] text-white">
          {weatherStatus}/{newsStatus}/{marketStatus}
        </span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
    </aside>
  );
};
