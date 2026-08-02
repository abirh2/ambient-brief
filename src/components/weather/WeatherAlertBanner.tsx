import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, AlertOctagon, X, ChevronRight, Layers } from 'lucide-react';
import { WeatherAlert, AlertSeverity } from '../../lib/types';
import { WeatherAlertModal } from './WeatherAlertModal';

interface WeatherAlertBannerProps {
  alert: WeatherAlert;
  onDismiss: () => void;
  className?: string;
  allAlerts?: WeatherAlert[];
  onDismissAlert?: (id: string) => void;
}

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({
  alert,
  onDismiss,
  className = '',
  allAlerts = [],
  onDismissAlert,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper for mapping NWS severity to theme colors
  const getMappedSeverity = (rawSeverity: string): AlertSeverity => {
    switch (String(rawSeverity).toLowerCase()) {
      case 'extreme':
        return 'emergency';
      case 'severe':
        return 'warning';
      case 'moderate':
        return 'watch';
      case 'minor':
      case 'unknown':
      default:
        return 'advisory';
    }
  };

  // Helper for reusable severity styling (Warning, Watch, Advisory, Emergency)
  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'emergency':
        return {
          label: 'EMERGENCY',
          bg: 'bg-rose-950/60 border-rose-500/50 text-rose-100 shadow-rose-950/40',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          iconBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          btnPrimary: 'bg-rose-600/80 hover:bg-rose-500 text-white shadow-rose-600/20',
          Icon: AlertOctagon,
        };
      case 'warning':
        return {
          label: 'WARNING',
          bg: 'bg-orange-950/60 border-orange-500/50 text-orange-100 shadow-orange-950/40',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          iconBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          btnPrimary: 'bg-orange-600/80 hover:bg-orange-500 text-white shadow-orange-600/20',
          Icon: ShieldAlert,
        };
      case 'watch':
        return {
          label: 'WATCH',
          bg: 'bg-amber-950/60 border-amber-500/50 text-amber-100 shadow-amber-950/40',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          btnPrimary: 'bg-amber-600/80 hover:bg-amber-500 text-white shadow-amber-600/20',
          Icon: AlertTriangle,
        };
      case 'advisory':
      default:
        return {
          label: 'ADVISORY',
          bg: 'bg-sky-950/60 border-sky-500/50 text-sky-100 shadow-sky-950/40',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          iconBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          btnPrimary: 'bg-sky-600/80 hover:bg-sky-500 text-white shadow-sky-600/20',
          Icon: Info,
        };
    }
  };

  const mappedSeverity = getMappedSeverity(alert.severity);
  const style = getSeverityStyle(mappedSeverity);
  const AlertIcon = style.Icon;

  const title = alert.event || 'Weather Alert';
  const summary = alert.headline || alert.description || '';

  const handleDismissClick = () => {
    if (onDismissAlert) {
      onDismissAlert(alert.id);
    } else {
      onDismiss();
    }
  };

  const hasMultipleAlerts = allAlerts.length > 1;

  return (
    <>
      <div
        role="region"
        aria-label={`Severe weather alert: ${title}`}
        className={`w-full rounded-2xl border backdrop-blur-xl p-3.5 sm:p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all animate-fade-in ${style.bg} ${className}`}
      >
        {/* Left Side: Icon + Severity + Title + Description + Source */}
        <div className="flex items-start gap-3 min-w-0 flex-grow">
          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${style.iconBg}`}>
            <AlertIcon className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-grow">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${style.badge}`}
              >
                {style.label}
              </span>
              <span className="text-[11px] font-sans font-medium text-slate-300">
                {alert.source}
              </span>
              {hasMultipleAlerts && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border bg-indigo-500/20 text-indigo-300 border-indigo-500/40 flex items-center gap-1 animate-pulse">
                  <Layers className="w-3 h-3" />
                  <span>+{allAlerts.length - 1} additional alerts</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white font-sans shrink-0">
                {title}
              </h3>
              <p className="text-xs text-slate-200/90 font-sans truncate max-w-xl">
                {summary}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Actions: View details + Dismiss */}
        <div className="flex items-center justify-end gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-white/10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer ${style.btnPrimary}`}
          >
            <span>{hasMultipleAlerts ? 'Browse alerts' : 'View details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDismissClick}
            aria-label={`Dismiss ${title}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <WeatherAlertModal
        alert={alert}
        allAlerts={hasMultipleAlerts ? allAlerts : undefined}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDismissAlert={onDismissAlert}
      />
    </>
  );
};
