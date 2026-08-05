import React, { useRef, useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, AlertOctagon, X, ChevronRight, Layers, Clock } from 'lucide-react';
import { WeatherAlert, AlertSeverity } from '../../../types';
import { WeatherAlertModal } from './WeatherAlertModal';
import { formatShortTime } from '../../../lib/formatting';
import { useSettingsStore } from '../../../stores/settingsStore';

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
  const { timeFormat, activeLocation } = useSettingsStore((state) => state.settings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const detailsButtonRef = useRef<HTMLButtonElement>(null);

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
          label: 'Emergency',
          tone: 'alert-emergency',
          Icon: AlertOctagon,
        };
      case 'warning':
        return {
          label: 'Warning',
          tone: 'alert-warning',
          Icon: ShieldAlert,
        };
      case 'watch':
        return {
          label: 'Watch',
          tone: 'alert-watch',
          Icon: AlertTriangle,
        };
      case 'advisory':
      default:
        return {
          label: 'Advisory',
          tone: 'alert-advisory',
          Icon: Info,
        };
    }
  };

  const mappedSeverity = getMappedSeverity(alert.severity);
  const style = getSeverityStyle(mappedSeverity);
  const AlertIcon = style.Icon;

  const title = alert.event || 'Weather Alert';
  const summary = getPracticalSummary(alert);
  const expiration = alert.expires ?? alert.ends;

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
        className={`weather-alert-banner tonal-section flex w-full flex-col gap-3 p-3.5 ${style.tone} ${className}`}
      >
        {/* Left Side: Icon + Severity + Title + Description + Source */}
        <div className="flex items-start gap-3 min-w-0 flex-grow">
          <div className="alert-icon shrink-0 mt-0.5" aria-hidden="true">
            <AlertIcon className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-grow">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="type-label alert-severity font-semibold">
                {style.label}
              </span>
              {hasMultipleAlerts && (
                <span className="type-metadata flex items-center gap-1 text-[color:var(--text-muted)]">
                  <Layers className="w-3 h-3" />
                  <span>{allAlerts.length - 1} more</span>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-[color:var(--text-primary)] font-sans">
                {title}
              </h2>
              <p className="alert-summary type-body text-[color:var(--text-secondary)] font-sans">
                {summary}
              </p>
              {expiration && (
                <span className="type-metadata flex items-center gap-1.5 text-[color:var(--text-muted)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Expires {formatShortTime(expiration, timeFormat, activeLocation?.timezone)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions: View details + Dismiss */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            ref={detailsButtonRef}
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="compact-control flex items-center gap-1 px-3 text-xs font-semibold cursor-pointer"
          >
            <span>{hasMultipleAlerts ? 'Browse alerts' : 'View details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDismissClick}
            aria-label={`Dismiss ${title}`}
            className="compact-control flex items-center gap-1 px-2.5 text-xs font-semibold cursor-pointer"
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
        triggerRef={detailsButtonRef}
        onDismissAlert={onDismissAlert}
      />
    </>
  );
};

function getPracticalSummary(alert: WeatherAlert): string {
  const descriptionSentence = alert.description
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s/)[0]
    ?.trim();
  const headline = alert.headline
    .replace(/^.*?issued\s+/i, '')
    .replace(/\s+by\s+NWS.*$/i, '')
    .trim();

  return descriptionSentence || headline || 'Review the affected area and take appropriate precautions.';
}
