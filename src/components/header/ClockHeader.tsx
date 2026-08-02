import React from 'react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useAppLocation } from '../../hooks/useAppLocation';
import { RefreshCw, Settings, Navigation, MapPin } from 'lucide-react';
import { formatClockParts, formatHeaderDate } from '../../lib/formatting';
import { useClock } from '../../features/clock/useClock';

interface ClockHeaderProps {
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  isRefreshing?: boolean;
  settingsBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const ClockHeader: React.FC<ClockHeaderProps> = ({
  onRefresh,
  onOpenSettings,
  isRefreshing,
  settingsBtnRef,
}) => {
  const { settings } = useSettingsStore();
  const { formattedLabel, compactLabel, activeLocation } = useAppLocation();

  const time = useClock();

  const is24h = settings.timeFormat === '24h';
  const { hours, minutes, seconds, period: ampm } = formatClockParts(time, settings.timeFormat);
  const dateString = formatHeaderDate(time);

  const displayLocation = compactLabel || settings.savedLocation || formatFallbackLocation(activeLocation);

  function formatFallbackLocation(loc: typeof activeLocation): string {
    if (loc.name && loc.name !== 'Current location') {
      return [loc.name, loc.admin1].filter(Boolean).join(', ');
    }
    return 'Upper Darby, PA';
  }

  const isDeviceGps = activeLocation.source === 'device';

  return (
    <header className="app-header w-full flex justify-between items-start gap-4 pt-1 pb-2 px-1 text-slate-100 z-20">
      <div className="flex flex-col min-w-0">
        {/* Prominent Clock */}
        <div className="clock-display flex items-baseline gap-2 font-mono font-light tracking-[-0.055em] text-white" aria-hidden="true">
          <span className="clock-primary text-[4.75rem] sm:text-[5.5rem] lg:text-[6.5rem] leading-[0.9] tabular-nums">{hours}:{minutes}</span>
          <span className="clock-seconds text-3xl sm:text-4xl lg:text-[2.75rem] text-slate-400/80 tabular-nums tracking-[-0.035em]">:{seconds}</span>
          {!is24h && ampm && (
            <span className="clock-period text-lg sm:text-xl font-sans font-medium tracking-[0.08em] text-slate-400 ml-1">{ampm}</span>
          )}
        </div>
        {/* Accessible label for the clock so it doesn't announce every second */}
        <span className="sr-only">
           Current time is {hours}:{minutes} {ampm || ''}
        </span>
        
        {/* Date and Location */}
        <div className="clock-context flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2 text-slate-200 min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-medium tracking-[-0.01em]">{dateString}</h2>
          <span className="hidden sm:inline text-slate-500">•</span>
          <div 
            className="flex items-center gap-1.5 text-sm sm:text-base text-slate-300 font-medium min-w-0"
            title={isDeviceGps ? `Device GPS Active — ${formattedLabel}` : formattedLabel}
            aria-label={isDeviceGps ? `Active location (Device GPS active): ${formattedLabel}` : `Active location: ${formattedLabel}`}
          >
            {isDeviceGps ? (
              <Navigation className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{displayLocation}</span>
            {isDeviceGps && (
              <span className="sr-only">(Device GPS Active)</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action icons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh ambient data"
          title="Refresh ambient data"
          className="p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 cursor-pointer shadow-sm backdrop-blur-md"
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
          className="p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-sm backdrop-blur-md"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
