import React from 'react';
import { MapPin, RefreshCw, Settings, Sparkles, Navigation } from 'lucide-react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useAppLocation } from '../../hooks/useAppLocation';

interface AppHeaderProps {
  dateString?: string;
  timeString?: string;
  locationName?: string;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  isRefreshing?: boolean;
  settingsBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  dateString = 'Wednesday, July 29',
  timeString = '2:13 PM',
  onRefresh,
  onOpenSettings,
  isRefreshing = false,
  settingsBtnRef,
}) => {
  const { settings } = useSettingsStore();
  const { formattedLabel, compactLabel, activeLocation } = useAppLocation();

  const formattedTime = React.useMemo(() => {
    if (settings.timeFormat === '24h') {
      if (timeString === '2:13 PM') return '14:13';
      return timeString.replace(' PM', '').replace(' AM', '');
    }
    return timeString;
  }, [timeString, settings.timeFormat]);

  const displayLocation = compactLabel || settings.savedLocation || formatFallbackLocation(activeLocation);

  function formatFallbackLocation(loc: typeof activeLocation): string {
    if (loc.name && loc.name !== 'Current location') {
      return [loc.name, loc.admin1].filter(Boolean).join(', ');
    }
    return 'Upper Darby, PA';
  }

  const isDeviceGps = activeLocation.source === 'device';

  return (
    <header className="app-header w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-1.5 px-1 text-slate-100 z-20">
      {/* Brand Title & Tagline */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white font-sans drop-shadow-sm">
              Ambient Brief
            </h1>
            {import.meta.env.DEV && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Phase 1 Visual Prototype
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium tracking-wide short-hide-desc">
            Ambient Daily Briefing Dashboard
          </span>
        </div>
      </div>

      {/* Header Info Items: Date, Time, Location, Actions */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-sm">
        {/* Date & Time display */}
        <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md shadow-sm font-mono text-xs">
          <span className="text-slate-100 font-semibold">{formattedTime}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-sans">{dateString}</span>
        </div>

        {/* Location pill with device GPS active indicator & accessible tooltip */}
        <div
          className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md shadow-sm max-w-[200px] sm:max-w-[260px] cursor-default"
          title={isDeviceGps ? `Device GPS Active — ${formattedLabel}` : formattedLabel}
          aria-label={isDeviceGps ? `Active location (Device GPS active): ${formattedLabel}` : `Active location: ${formattedLabel}`}
        >
          {isDeviceGps ? (
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
          )}
          <span className="font-medium truncate">{displayLocation}</span>
          {isDeviceGps && (
            <span className="sr-only">(Device GPS Active)</span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh ambient data"
            title="Refresh ambient data"
            className="p-2 rounded-lg bg-slate-900/30 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
            />
          </button>
          <button
            ref={settingsBtnRef}
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings preferences"
            title="Preferences"
            className="p-2 rounded-lg bg-slate-900/30 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
