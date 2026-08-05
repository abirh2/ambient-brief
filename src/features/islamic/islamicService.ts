import { DailyPrayerSchedule, PrayerName, PrayerTime } from '../../lib/types';
import { cacheService } from '../../lib/api/cacheService';
import { z } from 'zod';

const AladhanDataSchema = z.object({
  timings: z.record(z.string(), z.string()),
  meta: z.object({ timezone: z.string() }),
  date: z.object({
    gregorian: z.object({ date: z.string() }),
    hijri: z.object({
      day: z.string(),
      year: z.string(),
      date: z.string().optional(),
      month: z.object({ en: z.string() }),
    }),
  }),
});

const AladhanEnvelopeSchema = z.object({
  code: z.number(),
  status: z.string().optional(),
  data: AladhanDataSchema.optional(),
});

const SerializedPrayerScheduleSchema = z.object({
  gregorianDate: z.string(),
  hijriDate: z.object({
    day: z.number(),
    monthName: z.string(),
    year: z.number(),
    formatted: z.string(),
  }),
  timezone: z.string(),
  prayers: z.array(z.object({
    name: z.enum(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']),
    time: z.string(),
    timestamp: z.coerce.date(),
  })),
  calculationMethod: z.string(),
  asrMethod: z.enum(['standard', 'hanafi']),
});

// Centralized calculation methods and school types mappings as requested
export const ALADHAN_CALCULATION_METHODS = {
  ISNA: { id: 2, label: 'ISNA (North America)' },
  MWL: { id: 3, label: 'Muslim World League' },
  Egyptian: { id: 5, label: 'Egyptian General Authority' },
  Karachi: { id: 1, label: 'Karachi (Islamic Sciences)' },
  Makkah: { id: 4, label: 'Umm Al-Qura (Makkah)' },
} as const;

export const ALADHAN_ASR_METHODS = {
  Standard: { id: 0, label: 'Standard (Shafi, Maliki, Hanbali)' },
  Hanafi: { id: 1, label: 'Hanafi' },
} as const;

/**
 * Normalizes prayer times to HH:MM format safely, avoiding brittle substring assumptions.
 */
export function normalizeTimeStr(timeStr: string): string {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  const h = match[1].padStart(2, '0');
  const m = match[2];
  return `${h}:${m}`;
}

/**
 * Constructs a precise JavaScript Date object for a specific date and time in a target timezone.
 * Resolves local time in target timezone to absolute UTC.
 */
export function createTimezoneDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(utcDate);
    const p: Record<string, string> = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }

    const formattedYear = parseInt(p.year, 10);
    const formattedMonth = parseInt(p.month, 10);
    const formattedDay = parseInt(p.day, 10);
    let formattedHour = parseInt(p.hour, 10);
    if (formattedHour === 24) formattedHour = 0;
    const formattedMinute = parseInt(p.minute, 10);

    const formattedUtc = Date.UTC(formattedYear, formattedMonth - 1, formattedDay, formattedHour, formattedMinute, 0);
    const diffMs = utcDate.getTime() - formattedUtc;

    return new Date(utcDate.getTime() + diffMs);
  } catch (err) {
    console.warn(`Timezone formatting failed for timezone "${timezone}", falling back to local time:`, err);
    return new Date(year, month - 1, day, hour, minute, 0);
  }
}

/**
 * Extract date/time components for a given Date in a specific timezone.
 */
export function getLocalDateComponents(timezone: string, date: Date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }

    let hour = parseInt(p.hour, 10);
    if (hour === 24) hour = 0;

    return {
      year: parseInt(p.year, 10),
      month: parseInt(p.month, 10),
      day: parseInt(p.day, 10),
      hour,
      minute: parseInt(p.minute, 10),
      second: parseInt(p.second, 10),
    };
  } catch (err) {
    console.warn(`Failed to get components in timezone "${timezone}", using browser timezone:`, err);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
}

/**
 * Parses AlAdhan API response to clean, normalized structure.
 */
export function parseAladhanResponse(data: unknown, methodKey: string, schoolKey: string): DailyPrayerSchedule {
  const validatedData = AladhanDataSchema.parse(data);
  const timings = validatedData.timings;
  const timezone = validatedData.meta.timezone;
  const gregorianDate = validatedData.date.gregorian.date; // "DD-MM-YYYY"

  // Parse Hijri date safely, supporting missing/incomplete Hijri data fallback
  const hijri = validatedData.date.hijri;
  const hijriDay = parseInt(hijri?.day, 10) || 1;
  const hijriMonthName = hijri?.month?.en || 'Safar';
  const hijriYear = parseInt(hijri?.year, 10) || 1448;
  const hijriFormatted = hijri?.date || `${hijriDay} ${hijriMonthName} ${hijriYear}`;

  const [gDay, gMonth, gYear] = gregorianDate.split('-').map(Number);

  const prayerNames: { apiName: string; name: PrayerName }[] = [
    { apiName: 'Fajr', name: 'fajr' },
    { apiName: 'Sunrise', name: 'sunrise' },
    { apiName: 'Dhuhr', name: 'dhuhr' },
    { apiName: 'Asr', name: 'asr' },
    { apiName: 'Maghrib', name: 'maghrib' },
    { apiName: 'Isha', name: 'isha' },
  ];

  const prayers: PrayerTime[] = prayerNames.map(({ apiName, name }) => {
    const rawTime = timings[apiName];
    if (!rawTime) {
      throw new Error(`Missing prayer time for ${apiName}`);
    }
    const normalizedTime = normalizeTimeStr(rawTime);
    const [hour, minute] = normalizedTime.split(':').map(Number);
    const timestamp = createTimezoneDate(gYear, gMonth, gDay, hour, minute, timezone);

    return {
      name,
      time: normalizedTime,
      timestamp,
    };
  });

  return {
    gregorianDate,
    hijriDate: {
      day: hijriDay,
      monthName: hijriMonthName,
      year: hijriYear,
      formatted: hijriFormatted,
    },
    timezone,
    prayers,
    calculationMethod: methodKey,
    asrMethod: schoolKey.toLowerCase() === 'standard' ? 'standard' : 'hanafi',
  };
}

/**
 * Deserializes date strings in Cached schedules back to JavaScript Date objects.
 */
export function deserializeSchedule(data: unknown): DailyPrayerSchedule {
  return SerializedPrayerScheduleSchema.parse(data);
}

/**
 * Fetches daily prayer schedule for a specific location, date, and method settings.
 */
export async function fetchScheduleForDate(
  lat: number,
  lng: number,
  dateStr: string, // "DD-MM-YYYY"
  methodKey: string,
  schoolKey: string,
  signal?: AbortSignal,
): Promise<DailyPrayerSchedule> {
  const methodId = ALADHAN_CALCULATION_METHODS[methodKey as keyof typeof ALADHAN_CALCULATION_METHODS]?.id ?? 2;
  const schoolId = ALADHAN_ASR_METHODS[schoolKey as keyof typeof ALADHAN_ASR_METHODS]?.id ?? 1;

  const cacheKey = `prayers_${lat.toFixed(3)}_${lng.toFixed(3)}_${dateStr}_${methodId}_${schoolId}`;
  
  // Try to load from Cache first
  const cached = cacheService.getCache<unknown>(cacheKey);
  if (cached && cached.data) {
    return deserializeSchedule(cached.data);
  }

  // Live fetch from AlAdhan API
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${methodId}&school=${schoolId}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const json = AladhanEnvelopeSchema.parse(await res.json());
  if (json.code !== 200 || !json.data) {
    throw new Error(`AlAdhan API error: ${json.status || 'Invalid response format'}`);
  }

  const schedule = parseAladhanResponse(json.data, methodKey, schoolKey);
  
  // Cache for 24 hours
  cacheService.setCache(cacheKey, schedule, 24 * 60 * 60 * 1000);

  return schedule;
}
