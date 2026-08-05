import type { DailyPrayerSchedule, PrayerName, PrayerTime } from './model';

export interface NextPrayerInfo {
  name: Exclude<PrayerName, 'sunrise'>;
  time: string;
  timestamp: Date;
  timeRemainingText: string;
}

export function calculateNextPrayer(
  todaySchedule: DailyPrayerSchedule | null,
  tomorrowSchedule: DailyPrayerSchedule | null,
  now: Date = new Date(),
): NextPrayerInfo | null {
  if (!todaySchedule) return null;

  const nextToday = prayerCandidates(todaySchedule).find(
    (prayer) => prayer.timestamp.getTime() > now.getTime(),
  );
  const next = nextToday ?? prayerCandidates(tomorrowSchedule).find(
    (prayer) => prayer.name === 'fajr',
  );
  if (!next) return null;

  const remainingMinutes = Math.floor((next.timestamp.getTime() - now.getTime()) / 60_000);
  return {
    name: next.name,
    time: next.time,
    timestamp: next.timestamp,
    timeRemainingText: formatCountdown(remainingMinutes),
  };
}

function prayerCandidates(schedule: DailyPrayerSchedule | null): Array<PrayerTime & { name: Exclude<PrayerName, 'sunrise'> }> {
  if (!schedule) return [];
  return schedule.prayers.filter(
    (prayer): prayer is PrayerTime & { name: Exclude<PrayerName, 'sunrise'> } => prayer.name !== 'sunrise',
  );
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'now';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}
