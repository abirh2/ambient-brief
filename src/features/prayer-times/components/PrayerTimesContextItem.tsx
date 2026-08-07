import { useState } from 'react';
import { CalendarDays, ChevronDown, CircleDot, Loader2, MoonStar } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useIslamicStore } from '../../../stores/prayerTimesStore';
import { formatDisplayTime } from '../../../lib/formatting';
import type { PrayerName } from '../model';

const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function PrayerTimesContextItem() {
  const { settings } = useSettingsStore();
  const { todaySchedule, tomorrowSchedule, nextPrayer, loading, error, isStale } = useIslamicStore();
  const [expanded, setExpanded] = useState(false);

  if (!settings.islamic.enabled) return null;

  const timeZone = todaySchedule?.timezone ?? settings.activeLocation?.timezone;
  const formatPrayerTime = (timestamp: Date) => formatDisplayTime(timestamp, {
    timeFormat: settings.timeFormat,
    timeZone,
  });
  const scheduleForDisplay = todaySchedule?.prayers.some(
    (prayer) => prayer.timestamp.getTime() === nextPrayer?.timestamp.getTime(),
  ) ? todaySchedule : tomorrowSchedule ?? todaySchedule;

  return (
    <section className="prayer-context tonal-section min-w-0" aria-labelledby="prayer-context-title">
      <div className="prayer-context-header">
        <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
          <MoonStar className="h-4 w-4 semantic-info" aria-hidden="true" />
          <h3 id="prayer-context-title" className="type-label font-medium">Prayer times</h3>
        </div>
        {scheduleForDisplay && settings.islamic.showFullSchedule && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="compact-control disclosure-action prayer-schedule-action px-3 font-medium"
            aria-expanded={expanded}
            aria-controls="prayer-full-schedule"
          >
            Schedule
            <ChevronDown className={`h-3.5 w-3.5 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {loading && !todaySchedule ? (
        <div className="prayer-status" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Calculating prayer times…</div>
      ) : error && !todaySchedule ? (
        <div className="prayer-status is-error" role="status">Prayer times unavailable</div>
      ) : nextPrayer ? (
        <>
          <div className="prayer-next" title={`Calculation: ${settings.islamic.calculationMethod}; Asr: ${settings.islamic.asrMethod}`}>
            <div className="prayer-next-name">{PRAYER_LABELS[nextPrayer.name]}</div>
            <div className="prayer-next-time numeric tabular-data">{formatPrayerTime(nextPrayer.timestamp)}</div>
            <div className="prayer-countdown numeric tabular-data">in {nextPrayer.timeRemainingText}</div>
          </div>

          {settings.islamic.showHijriDate && todaySchedule?.hijriDate && (
            <div className="prayer-hijri type-metadata">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatHijriDate(todaySchedule.hijriDate)}</span>
              {isStale && <span className="semantic-warning">Cached</span>}
            </div>
          )}

          {expanded && scheduleForDisplay && (
            <div id="prayer-full-schedule" className="prayer-schedule" aria-label="Full prayer schedule">
              {scheduleForDisplay.prayers.map((prayer) => {
                const isNext = prayer.timestamp.getTime() === nextPrayer.timestamp.getTime();
                const isPast = !isNext && prayer.timestamp.getTime() < Date.now();
                return (
                  <div key={prayer.name} className="prayer-schedule-row" data-next={isNext || undefined} data-past={isPast || undefined}>
                    <span className="flex items-center gap-2 font-medium">
                      {isNext && <CircleDot className="h-3.5 w-3.5 semantic-info" aria-hidden="true" />}
                      <span>{PRAYER_LABELS[prayer.name]}</span>
                      {isNext && <span className="prayer-next-label">Next</span>}
                    </span>
                    <time className="numeric tabular-data" dateTime={prayer.timestamp.toISOString()}>
                      {formatPrayerTime(prayer.timestamp)}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="prayer-status" role="status">Calculating the next prayer…</div>
      )}
    </section>
  );
}

export function formatHijriDate(value: { day: number; monthName: string; year: number }): string {
  return `${value.day} ${value.monthName.trim().replace(/\s+/g, ' ')} ${value.year}`;
}
