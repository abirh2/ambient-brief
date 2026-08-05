import { describe, expect, it } from 'vitest';
import { createDateInTimeZone } from '../../../lib/formatting';
import { calculateNextPrayer } from '../calculation';
import type { DailyPrayerSchedule, PrayerName } from '../model';

const TIME_ZONE = 'America/New_York';
const TIMES: Array<[PrayerName, string]> = [
  ['fajr', '05:10'], ['sunrise', '06:32'], ['dhuhr', '13:08'],
  ['asr', '18:05'], ['maghrib', '20:14'], ['isha', '21:37'],
];

function schedule(day: number): DailyPrayerSchedule {
  return {
    gregorianDate: `${String(day).padStart(2, '0')}-08-2026`,
    hijriDate: { day: 22, monthName: 'Safar', year: 1448 },
    timezone: TIME_ZONE,
    prayers: TIMES.map(([name, time]) => {
      const [hour, minute] = time.split(':').map(Number);
      return { name, time, timestamp: createDateInTimeZone(2026, 8, day, hour, minute, TIME_ZONE) };
    }),
    calculationMethod: 'ISNA',
    asrMethod: 'hanafi',
  };
}

const at = (day: number, hour: number, minute: number) =>
  createDateInTimeZone(2026, 8, day, hour, minute, TIME_ZONE);

describe('next prayer calculation', () => {
  it('selects Fajr before Fajr', () => {
    expect(calculateNextPrayer(schedule(5), schedule(6), at(5, 4, 0))?.name).toBe('fajr');
  });

  it('skips Sunrise between prayers', () => {
    expect(calculateNextPrayer(schedule(5), schedule(6), at(5, 5, 30))?.name).toBe('dhuhr');
  });

  it('selects the next prayer between prayers', () => {
    const result = calculateNextPrayer(schedule(5), schedule(6), at(5, 13, 27));
    expect(result?.name).toBe('asr');
    expect(result?.timeRemainingText).toBe('4h 38m');
  });

  it('selects the following day Fajr after Isha', () => {
    expect(calculateNextPrayer(schedule(5), schedule(6), at(5, 22, 0))?.name).toBe('fajr');
  });

  it('keeps the following day Fajr through midnight rollover', () => {
    const beforeMidnight = calculateNextPrayer(schedule(5), schedule(6), at(5, 23, 59));
    const afterMidnight = calculateNextPrayer(schedule(5), schedule(6), at(6, 0, 1));
    expect(beforeMidnight?.timestamp.toISOString()).toBe(afterMidnight?.timestamp.toISOString());
    expect(afterMidnight?.name).toBe('fajr');
  });
});
