import React from 'react';
import { Moon, Sunrise, Sun, CloudSun, Sunset, Compass, Loader2, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { useIslamicStore } from '../../lib/stores/useIslamicStore';

interface PrayerScheduleSectionProps {
  className?: string;
}

const PRAYER_ICONS: Record<string, React.ElementType> = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
};

export function formatPrayerTime(time24: string, is24h: boolean): string {
  if (!time24) return '';
  if (is24h) return time24;

  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

export const PrayerScheduleSection: React.FC<PrayerScheduleSectionProps> = ({
  className = '',
}) => {
  const { settings } = useSettingsStore();
  const { todaySchedule, nextPrayer, loading, error, isStale } = useIslamicStore();

  if (!settings.islamic.enabled || !settings.islamic.showFullSchedule) {
    return null;
  }

  const is24h = settings.timeFormat === '24h';
  const isCompact = settings.contentDensity === 'compact';

  // Loading state (only when we don't have cached/stale data yet)
  if (loading && !todaySchedule) {
    return (
      <div className={`w-full flex flex-col items-center justify-center py-8 gap-2 border-t border-white/10 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-xs text-slate-400">Loading prayer schedule...</span>
      </div>
    );
  }

  // Error state (only when we don't have fallback cache)
  if (error && !todaySchedule) {
    return (
      <div className={`w-full flex flex-col items-center justify-center py-6 gap-2 border-t border-white/10 text-slate-400 ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-400" />
        <span className="text-xs font-medium text-red-200">Prayer times unavailable.</span>
        <span className="text-[10px] text-slate-500">Please check your network connection or try again later.</span>
      </div>
    );
  }

  if (!todaySchedule) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Islamic Prayer Schedule"
      className={`w-full flex flex-col gap-2.5 pt-3 border-t border-white/10 ${className}`}
    >
      {/* Schedule Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Prayer Schedule
          </h3>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-medium text-slate-300">
            {todaySchedule.hijriDate.formatted}
          </span>
          {isStale && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-300">
              stale cache
            </span>
          )}
        </div>

        {/* Calculation & Asr Method Badges */}
        <div
          className="flex items-center gap-1.5 text-[11px] font-sans text-slate-400"
          title={`Calculation: ${settings.islamic.calculationMethod}, Juristic Method: ${settings.islamic.asrMethod}`}
        >
          <Compass className="w-3 h-3 text-slate-500" aria-hidden="true" />
          <span>
            {settings.islamic.calculationMethod} · {settings.islamic.asrMethod === 'Hanafi' ? 'Hanafi' : 'Standard'}
          </span>
        </div>
      </div>

      {/* Grid of 6 Prayer Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {todaySchedule.prayers.map((prayer) => {
          const PrayerIcon = PRAYER_ICONS[prayer.name] || Sun;
          const displayTime = formatPrayerTime(prayer.time, is24h);
          const isNext = nextPrayer && nextPrayer.name === prayer.name;

          if (isNext) {
            return (
              <div
                key={prayer.name}
                aria-current="time"
                aria-label={`${prayer.name} prayer at ${displayTime}, next prayer in ${nextPrayer.timeRemainingText}`}
                className={`relative flex flex-col justify-between rounded-xl bg-indigo-950/70 border border-indigo-500/50 p-2.5 text-indigo-100 shadow-md ring-1 ring-indigo-500/30 ${
                  isCompact ? 'py-2 px-2.5' : 'p-2.5'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <PrayerIcon className="w-3.5 h-3.5 text-indigo-300 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold font-sans text-white capitalize">{prayer.name}</span>
                  </div>
                  {/* Non-color accessibility indicator for Next Prayer */}
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 text-[9px] font-mono font-bold uppercase tracking-wider border border-indigo-400/40">
                    Next
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-1 mt-1.5">
                  <span className="text-sm font-semibold font-mono text-white tracking-tight">
                    {displayTime}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 font-medium">
                    in {nextPrayer.timeRemainingText}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={prayer.name}
              aria-label={`${prayer.name} prayer at ${displayTime}`}
              className={`flex flex-col justify-between rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 p-2.5 text-slate-300 transition-colors ${
                isCompact ? 'py-2 px-2.5' : 'p-2.5'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <PrayerIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium font-sans text-slate-300 capitalize">
                  {prayer.name}
                </span>
              </div>

              <div className="mt-1.5">
                <span className="text-sm font-semibold font-mono text-slate-200 tracking-tight">
                  {displayTime}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source attribution and disclaimer footer */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 border-t border-white/5 pt-2">
        <span>Data provided by AlAdhan.com</span>
        <span className="italic">Reference times only. Confirm with your local masjid.</span>
      </div>
    </div>
  );
};
