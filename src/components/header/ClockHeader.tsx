import React from 'react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useAppLocation } from '../../hooks/useAppLocation';
import { RefreshCw, Settings, Navigation, Wifi, WifiOff } from 'lucide-react';
import { formatClockParts, formatHeaderDate } from '../../lib/formatting';
import { useClock } from '../../features/clock/useClock';
import type { GlobalRefreshStatus } from '../../app/useAmbientBriefController';

interface ClockHeaderProps {
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  isRefreshing?: boolean;
  globalStatus?: GlobalRefreshStatus;
  settingsBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const ClockHeader: React.FC<ClockHeaderProps> = ({
  onRefresh,
  onOpenSettings,
  isRefreshing,
  globalStatus,
  settingsBtnRef,
}) => {
  const { settings } = useSettingsStore();
  const { formattedLabel, compactLabel, activeLocation } = useAppLocation();

  const time = useClock();

  const is24h = settings.timeFormat === '24h';
  const timeZone = settings.activeLocation?.timezone;
  const { hours, minutes, seconds, period: ampm } = formatClockParts(time, settings.timeFormat, timeZone);
  const dateString = formatHeaderDate(time, timeZone);

  const displayLocation = compactLabel || settings.savedLocation || formatFallbackLocation(activeLocation);

  function formatFallbackLocation(loc: typeof activeLocation): string {
    if (loc.name && loc.name !== 'Current location') {
      return [loc.name, loc.admin1].filter(Boolean).join(', ');
    }
    return 'Upper Darby, PA';
  }

  const isDeviceGps = activeLocation.source === 'device';

  const showConnectionStatus = globalStatus && (globalStatus.state === 'offline' || globalStatus.state === 'partial');

  return (
    <header className="app-header w-full flex justify-between items-start gap-4 z-20">
      <div className="flex flex-col min-w-0">
        {/* Prominent Clock */}
        <div className="clock-display flex items-baseline gap-2 font-light tracking-[-0.055em]" aria-hidden="true">
          <span className="clock-primary type-hero-clock leading-[0.9] tabular-nums">{hours}:{minutes}</span>
          <span className="clock-seconds type-clock-seconds text-[color:var(--text-muted)] tabular-nums tracking-[-0.035em]">:{seconds}</span>
          {!is24h && ampm && (
            <span className="clock-period text-lg sm:text-xl font-sans font-medium tracking-[0.08em] text-slate-400 ml-1">{ampm}</span>
          )}
        </div>
        {/* Accessible label for the clock so it doesn't announce every second */}
        <span className="sr-only" aria-live="off">
           Current time is {hours}:{minutes} {ampm || ''}
        </span>
        
        {/* Date and Location */}
        <div className="clock-context flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-2 min-w-0">
          <h1 className="type-date font-medium tracking-[-0.01em]">{dateString}</h1>
          <span className="hidden sm:inline text-[color:var(--text-subtle)]">/</span>
          <div 
            className="type-location flex items-center gap-1.5 text-[color:var(--text-secondary)] font-medium min-w-0"
            title={isDeviceGps ? `Device GPS Active — ${formattedLabel}` : formattedLabel}
            aria-label={isDeviceGps ? `Active location (Device GPS active): ${formattedLabel}` : `Active location: ${formattedLabel}`}
          >
            {isDeviceGps && <Navigation className="w-3.5 h-3.5 text-[color:var(--positive)] shrink-0" aria-hidden="true" />}
            <span className="truncate max-w-[min(52vw,40rem)]">{displayLocation}</span>
            {isDeviceGps && (
              <span className="sr-only">(Device GPS Active)</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action icons */}
      <div className="flex items-center gap-2 shrink-0">
        {showConnectionStatus && (
          <div
            className="status-note hidden sm:flex items-center gap-1.5 px-2 py-1.5 font-medium"
            role="status"
            aria-live="polite"
            title="Connection and data status"
          >
            {globalStatus.state === 'offline' ? <WifiOff className="w-3 h-3 text-amber-400" />
              : <Wifi className="w-3 h-3 text-amber-400" />}
            <span>{globalStatus.label}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh ambient data"
          title="Refresh ambient data"
          className="compact-control p-2.5 cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin semantic-info' : ''}`}
          />
        </button>
        <button
          ref={settingsBtnRef}
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings preferences"
          title="Preferences"
          className="compact-control p-2.5 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
