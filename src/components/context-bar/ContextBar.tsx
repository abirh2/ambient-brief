import React, { useState, useRef, useEffect } from 'react';
import { Wind, Sun, Sunset, DollarSign, Clock, Moon, Calendar, Loader2, X } from 'lucide-react';
import { useIslamicStore } from '../../lib/stores/useIslamicStore';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useAirQuality } from '../../features/air-quality/hooks/useAirQuality';
import { interpretAqi } from '../../features/air-quality/utils/aqiInterpreter';
import { AirQualityPopover } from '../air-quality/AirQualityPopover';
import { AnimatePresence } from 'motion/react';
import { useCurrencyStore } from '../../lib/stores/useCurrencyStore';

interface ContextBarProps {
  uvIndex: number | null;
  uvLabel: string;
  sunset: string | null;
  weatherFreshness: string;
}

function getRelativeTime(isoString: string): string {
  try {
    const fetched = new Date(isoString).getTime();
    const diffMs = Date.now() - fetched;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'recently';
  }
}

export const ContextBar: React.FC<ContextBarProps> = ({
  uvIndex,
  uvLabel,
  sunset,
  weatherFreshness,
}) => {
  const { settings } = useSettingsStore();
  const { aqiState } = useAirQuality();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const [isIslamicOpen, setIsIslamicOpen] = useState(false);

  const { rate, rateLoading, rateError, isStale: isRateStale, fetchExchangeRate } = useCurrencyStore();
  const { todaySchedule, nextPrayer, loading: islamicLoading, error: islamicError, isStale: islamicIsStale } = useIslamicStore();

  const selectedPair = settings.currencyPair || 'USD/BDT';
  const [base, quote] = selectedPair.split('/');

  // Fetch exchange rate on setup or change
  useEffect(() => {
    if (settings.currencyEnabled && base && quote) {
      fetchExchangeRate(base, quote);
    }
  }, [settings.currencyEnabled, base, quote, fetchExchangeRate]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Close currency popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };

    if (isCurrencyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCurrencyOpen]);


  // Render air quality part of the bar
  const renderAqiSection = () => {
    if (aqiState.status === 'loading') {
      return (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          <span>Loading AQI...</span>
        </div>
      );
    }

    if (aqiState.status === 'unavailable') {
      return (
        <div className="flex items-center gap-2 text-slate-500">
          <Wind className="w-3.5 h-3.5" aria-hidden="true" />
          <span>AQI unavailable</span>
        </div>
      );
    }

    const aqiSnapshot = aqiState.data;
    const aqiVal = aqiSnapshot.usAqi;
    const interpretation = interpretAqi(aqiVal);

    return (
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md transition-colors cursor-pointer text-left focus:outline-none"
          aria-haspopup="true"
          aria-expanded={isPopoverOpen}
        >
          <Wind className={`w-3.5 h-3.5 ${interpretation.textClass}`} aria-hidden="true" />
          <span className="text-slate-400">AQI</span>
          <span className="font-semibold text-slate-100 font-mono">{aqiVal !== null ? aqiVal : '--'}</span>
          <span className={`${interpretation.textClass} font-medium`}>· {interpretation.label}</span>
        </button>

        <AnimatePresence>
          {isPopoverOpen && (
            <AirQualityPopover
              data={aqiSnapshot}
              onClose={() => setIsPopoverOpen(false)}
              lastUpdatedText={aqiState.status === 'cached' ? aqiState.lastUpdatedText : undefined}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-[1900px]:grid-cols-1 gap-4 px-4 sm:px-5 py-4 rounded-xl bg-slate-900/40 border border-white/10 backdrop-blur-md text-sm text-slate-300 font-sans shadow-md items-start">
      {/* Environment Group */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Environment</h3>
        
        {renderAqiSection()}

        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span className="text-slate-400 w-16">UV</span>
          <span className="font-semibold text-slate-100 font-mono">{uvIndex ?? '--'}</span>
          <span className="text-amber-300 font-medium text-xs">· {uvLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <Sunset className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
          <span className="text-slate-400 w-16">Sunset</span>
          <span className="font-semibold text-slate-100 font-mono">{sunset ?? '--'}</span>
        </div>
      </div>

      {/* Finance Group */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Finance</h3>
        
        {settings.currencyEnabled ? (
          <div className="relative w-fit" ref={currencyRef} id="context-bar-currency">
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 -ml-2 rounded-md transition-colors cursor-pointer text-left focus:outline-none"
              aria-haspopup="true"
              aria-expanded={isCurrencyOpen}
            >
              <DollarSign className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
              <span className="text-slate-400 w-14 font-mono">{selectedPair}</span>
              {rateLoading && !rate ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" aria-hidden="true" />
              ) : rateError ? (
                <span className="text-red-400 font-medium">Unavailable</span>
              ) : rate ? (
                <span className="font-semibold text-slate-100 font-mono">
                  {rate.rate.toFixed(2)}
                  {isRateStale && <span className="text-[10px] text-amber-400 ml-1 font-sans font-normal">(stale)</span>}
                </span>
              ) : (
                <span className="text-slate-500 font-mono">--</span>
              )}
            </button>

            <AnimatePresence>
              {isCurrencyOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 p-4 rounded-xl bg-slate-950 border border-white/15 shadow-2xl text-xs text-slate-200 z-50 flex flex-col gap-3 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-slate-100 text-sm">Exchange Rate Details</span>
                    <button
                      onClick={() => setIsCurrencyOpen(false)}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                      aria-label="Close details"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {rateLoading && (
                    <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Fetching latest rates...</span>
                    </div>
                  )}

                  {rateError && !rateLoading && (
                    <div className="text-center py-2 text-red-400 font-medium bg-red-950/20 border border-red-500/10 rounded-lg">
                      {rateError}
                    </div>
                  )}

                  {rate && !rateLoading && (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col bg-slate-900/50 border border-white/5 p-3 rounded-lg text-center gap-1">
                        <span className="text-slate-400 text-[10px] uppercase tracking-wider font-mono">Current Reference Rate</span>
                        <span className="text-xl font-extrabold text-white font-mono">
                          1 {rate.base} = {rate.rate.toFixed(4)} {rate.quote}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-400 border-t border-white/5 pt-2 mt-1">
                        <div>Reference Date:</div>
                        <div className="text-right font-mono text-slate-200">{rate.date}</div>

                        <div>Data Source:</div>
                        <div className="text-right text-slate-200">Frankfurter API</div>

                        <div>Last Fetched:</div>
                        <div className="text-right text-slate-200 font-mono">
                          {getRelativeTime(rate.fetchedAt)}
                        </div>
                      </div>

                      {isRateStale && (
                        <div className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-500/10 rounded px-2 py-1 text-center font-medium mt-1">
                          Showing cached rate (offline fallback)
                        </div>
                      )}

                      <p className="text-[9px] leading-relaxed text-slate-500 text-center italic mt-1.5 border-t border-white/5 pt-2">
                        Reference rate; not a guaranteed consumer conversion rate
                      </p>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-slate-500 text-xs italic">Currency disabled</div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span className="text-slate-400">Last refreshed</span>
          <span className="font-semibold text-slate-100 font-mono text-xs">{weatherFreshness}</span>
        </div>
      </div>

      {/* Islamic Information Group */}
      {settings.islamic.enabled && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Islamic Schedule</h3>
          
          {settings.islamic.showNextPrayer && (
            <div
              className="flex items-start gap-2"
              title={`Calculation: ${settings.islamic.calculationMethod}, Asr: ${settings.islamic.asrMethod}`}
              aria-label={
                islamicError && !todaySchedule
                  ? "Prayer times unavailable."
                  : nextPrayer
                  ? `Next prayer: ${nextPrayer.name} in ${nextPrayer.timeRemainingText}`
                  : "Calculating prayer times..."
              }
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400 mt-0.5" aria-hidden="true" />
              {islamicLoading && !todaySchedule ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" aria-hidden="true" />
                  <span className="text-slate-400">Calculating...</span>
                </div>
              ) : islamicError && !todaySchedule ? (
                <span className="text-red-400 font-medium">Prayer times unavailable</span>
              ) : nextPrayer ? (
                <div className="flex flex-col w-full">
                  <div className="flex items-baseline justify-between gap-2 w-full">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-100 text-base">
                        {nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1)}
                      </span>
                      <span className="text-indigo-300 font-mono text-sm">
                        {nextPrayer.time}
                      </span>
                    </div>
                    {settings.islamic.showFullSchedule && (
                      <button 
                        onClick={() => setIsIslamicOpen((prev) => !prev)}
                        className="text-xs text-slate-400 hover:text-slate-200 focus:outline-none"
                      >
                        {isIslamicOpen ? 'Hide' : 'Full schedule'}
                      </button>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs font-mono">
                    in {nextPrayer.timeRemainingText}
                    {islamicIsStale && <span className="text-amber-400 ml-1">(stale)</span>}
                  </span>
                  
                  {settings.islamic.showFullSchedule && isIslamicOpen && todaySchedule && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5 w-full pr-4 text-xs font-mono">
                      {todaySchedule.prayers.map(prayer => {
                        const isNext = nextPrayer.name === prayer.name;
                        const label = prayer.name.charAt(0).toUpperCase() + prayer.name.slice(1);
                        return (
                          <div key={prayer.name} className={`flex justify-between items-center ${isNext ? 'text-indigo-300 font-bold bg-indigo-900/20 px-1 -mx-1 rounded' : 'text-slate-300'}`}>
                            <span className="font-sans">{label}</span>
                            <span>{prayer.time} {isNext && '← Next'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-slate-500">Calculating...</span>
              )}
            </div>
          )}

          {settings.islamic.showHijriDate && todaySchedule && (
            <div className="flex items-center gap-2 mt-1" aria-label={`Hijri date: ${todaySchedule.hijriDate.formatted}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="font-medium text-slate-300 text-xs">
                {todaySchedule.hijriDate.formatted}
                {islamicIsStale && <span className="text-[10px] text-amber-400 ml-1 font-sans font-normal">(stale)</span>}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
