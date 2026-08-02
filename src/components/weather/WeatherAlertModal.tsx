import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  AlertOctagon,
  X,
  Clock,
  MapPin,
  CheckCircle2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { WeatherAlert, AlertSeverity } from '../../lib/types';

interface WeatherAlertModalProps {
  alert: WeatherAlert;
  allAlerts?: WeatherAlert[];
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  onDismissAlert?: (id: string) => void;
}

export const WeatherAlertModal: React.FC<WeatherAlertModalProps> = ({
  alert: initialAlert,
  allAlerts,
  isOpen,
  onClose,
  triggerRef,
  onDismissAlert,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Sync index if alert changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (allAlerts && allAlerts.length > 0) {
        const foundIdx = allAlerts.findIndex((a) => a.id === initialAlert.id);
        setActiveIndex(foundIdx >= 0 ? foundIdx : 0);
      } else {
        setActiveIndex(0);
      }
    }
  }, [isOpen, initialAlert, allAlerts]);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Lock body scroll
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const triggerElement = triggerRef?.current;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
      // Return focus to trigger
      triggerElement?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Resolve currently viewed alert
  const currentAlert = allAlerts && allAlerts.length > 0 ? allAlerts[activeIndex] : initialAlert;

  if (!currentAlert) return null;

  // Severity styling configurations
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

  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'emergency':
        return {
          label: 'EMERGENCY',
          bg: 'bg-rose-950/90 border-rose-600/60 text-rose-100',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          iconBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accentBorder: 'border-rose-500/40',
          Icon: AlertOctagon,
        };
      case 'warning':
        return {
          label: 'WARNING',
          bg: 'bg-orange-950/90 border-orange-500/50 text-orange-100',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          iconBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          accentBorder: 'border-orange-500/40',
          Icon: ShieldAlert,
        };
      case 'watch':
        return {
          label: 'WATCH',
          bg: 'bg-amber-950/90 border-amber-500/50 text-amber-100',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accentBorder: 'border-amber-500/40',
          Icon: AlertTriangle,
        };
      case 'advisory':
      default:
        return {
          label: 'ADVISORY',
          bg: 'bg-sky-950/90 border-sky-500/50 text-sky-100',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          iconBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          accentBorder: 'border-sky-500/40',
          Icon: Info,
        };
    }
  };

  const mappedSeverity = getMappedSeverity(currentAlert.severity);
  const config = getSeverityConfig(mappedSeverity);
  const SeverityIcon = config.Icon;

  // Graceful formatting of timings
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const effectiveDisplay = formatTime(currentAlert.effective);
  const expiresDisplay = formatTime(currentAlert.expires);
  const affectedArea = currentAlert.areaDescription || 'Affected Area';
  const fullDescription = currentAlert.description;

  // Extract instructions as bullets
  const instructionsList = currentAlert.instruction
    ? currentAlert.instruction.split('\n').map((i) => i.trim()).filter(Boolean)
    : [];

  const handlePrev = () => {
    if (allAlerts && allAlerts.length > 0) {
      setActiveIndex((prev) => (prev === 0 ? allAlerts.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (allAlerts && allAlerts.length > 0) {
      setActiveIndex((prev) => (prev === allAlerts.length - 1 ? 0 : prev + 1));
    }
  };

  const handleDismissAlertClick = () => {
    if (onDismissAlert) {
      onDismissAlert(currentAlert.id);
      // If there are other alerts, move to previous or next
      if (allAlerts && allAlerts.length > 1) {
        handleNext();
      } else {
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-desc"
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col gap-6 ${config.bg} ${config.accentBorder}`}
      >
        {/* Navigation Toolbar when there are multiple alerts */}
        {allAlerts && allAlerts.length > 1 && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2.5 -mb-2">
            <div className="flex items-center gap-2 text-xs font-sans text-slate-300">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-white">
                Alert {activeIndex + 1} of {allAlerts.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Previous Alert"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Next Alert"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Close Button Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.iconBg}`}>
              <SeverityIcon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${config.badgeBg}`}
                >
                  {config.label}
                </span>
                <span className="text-xs text-slate-300 font-sans font-medium">
                  {currentAlert.source}
                </span>
              </div>
              <h2
                id="alert-modal-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-white"
              >
                {currentAlert.event || 'Weather Alert'}
              </h2>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close details modal"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0 animate-fade-in"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timings & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-sans">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-medium">Effective &amp; Expiration</span>
              <span className="text-slate-200 font-mono">
                {effectiveDisplay} – {expiresDisplay}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-400 font-medium">Affected Area</span>
              <span className="text-slate-200">{affectedArea}</span>
            </div>
          </div>
        </div>

        {/* Full Description */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Detailed Statement
          </h3>
          <p
            id="alert-modal-desc"
            className="text-sm text-slate-200/90 leading-relaxed font-sans bg-slate-900/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap max-h-[250px] overflow-y-auto"
          >
            {fullDescription}
          </p>
        </div>

        {/* Safety Instructions */}
        {instructionsList && instructionsList.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Recommended Action &amp; Safety Instructions
            </h3>
            <ul className="flex flex-col gap-2 font-sans text-xs">
              {instructionsList.map((instruction: string, idx: number) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/40 border border-white/5 text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer with Attribution & Specific Dismiss */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 font-sans">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Issued by {currentAlert.senderName || 'National Weather Service'}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onDismissAlert && (
              <button
                type="button"
                onClick={handleDismissAlertClick}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-colors"
              >
                Dismiss this alert
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/10 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
