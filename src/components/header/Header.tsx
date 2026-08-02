import React from 'react';
import { MapPin, RefreshCw, Settings, Sparkles, Eye } from 'lucide-react';
import { useSystemClock } from '../../hooks/useSystemClock';
import { formatClockTime, formatHeaderDate } from '../../lib/formatting/dateUtils';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';

interface HeaderProps {
  onOpenSettings: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onRefreshData,
  isRefreshing = false,
}) => {
  const currentTime = useSystemClock();
  const { settings } = useSettingsStore();

  return (
    <header className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 glass-panel border-white/10 z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0 border border-indigo-400/30">
          <Eye className="w-5 h-5 text-slate-100" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-white font-sans">
              Ambient Brief
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 tracking-wide">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Phase 1 Visual Prototype
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium mt-0.5">
            Ambient Information Dashboard
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-300 font-mono">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="text-slate-100 font-bold">
            {formatClockTime(currentTime, settings.timeFormat)}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-sans text-xs">
            {formatHeaderDate(currentTime)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-sans bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{settings.savedLocation || 'Upper Darby, PA'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            title="Refresh mock data"
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
          <button
            onClick={onOpenSettings}
            title="Preferences"
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
