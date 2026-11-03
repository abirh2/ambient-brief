import { DailyPrayerSchedule, PrayerName, PrayerTime } from '../../lib/types';
import { cacheService } from '../../lib/api/cacheService';
import { withRequestDeadline } from '../../lib/api/requestDeadline';
import { readContextCache } from '../../lib/api/contextCache';
import { z } from 'zod';
import { createDateInTimeZone } from '../../lib/formatting';

const HijriDateSchema = z.object({
  day: z.string().regex(/^\d{1,2}$/),
  year: z.string().regex(/^\d{3,4}$/),
  date: z.string().optional(),
  month: z.object({ en: z.string().trim().min(1) }),
});

const AladhanDataSchema = z.object({
  timings: z.record(z.string(), z.string()),
  meta: z.object({ timezone: z.string() }),
  date: z.object({
    gregorian: z.object({ date: z.string() }),
    hijri: HijriDateSchema.nullish(),
  }),
});

const AladhanEnvelopeSchema = z.object({
  code: z.number(),
  status: z.string().optional(),
  data: AladhanDataSchema.optional(),
});

const SerializedPrayerScheduleSchema = z.object({
  gregorianDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  hijriDate: z.object({
    day: z.number(),
    monthName: z.string(),
    year: z.number(),
    formatted: z.string().optional(),
  }).nullable().transform((value) => value ? {
    day: value.day,
    monthName: value.monthName,
    year: value.year,
  } : null),
  timezone: z.string(),
  prayers: z.array(z.object({
    name: z.enum(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']),
    time: z.string(),
    timestamp: z.coerce.date(),
  })),
  calculationMethod: z.enum(['ISNA', 'MWL', 'Egyptian', 'Karachi', 'Makkah']),
  asrMethod: z.enum(['standard', 'hanafi']),
  provenance: z.object({ successfulFetchAt: z.iso.datetime(), origin: z.enum(['network', 'cache']) }).optional(),
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
  const match = timeStr.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)(?:\s+\([A-Za-z0-9_+:/-]{1,16}\))?$/);
  if (!match) throw new Error(`Invalid provider prayer time: ${timeStr || '(empty)'}`);
  return `${match[1].padStart(2, '0')}:${match[2]}`;
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
  try {
    return createDateInTimeZone(year, month, day, hour, minute, timezone);
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
  const hijriDate = hijri ? {
    day: Number.parseInt(hijri.day, 10),
    monthName: normalizeHijriMonthName(hijri.month.en),
    year: Number.parseInt(hijri.year, 10),
  } : null;

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
    hijriDate,
    timezone,
    prayers,
    calculationMethod: methodKey,
    asrMethod: schoolKey.toLowerCase() === 'standard' ? 'standard' : 'hanafi',
  };
}

function normalizeHijriMonthName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Deserializes date strings in Cached schedules back to JavaScript Date objects.
 */
export function deserializeSchedule(data: unknown): DailyPrayerSchedule {
  const schedule = SerializedPrayerScheduleSchema.parse(data);
  new Intl.DateTimeFormat('en', { timeZone: schedule.timezone });
  const [day, month, year] = schedule.gregorianDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 || date.getUTCFullYear() !== year) throw new Error('Invalid schedule date');
  if (new Set(schedule.prayers.map((prayer) => prayer.name)).size !== 6 || schedule.prayers.length !== 6) throw new Error('Incomplete schedule');
  for (const prayer of schedule.prayers) {
    const normalized = normalizeTimeStr(prayer.time);
    const [hour, minute] = normalized.split(':').map(Number);
    if (prayer.timestamp.getTime() !== createDateInTimeZone(year, month, day, hour, minute, schedule.timezone).getTime()) throw new Error('Mismatched schedule timestamp');
  }
  if (schedule.provenance && Date.parse(schedule.provenance.successfulFetchAt) > Date.now()) throw new Error('Future schedule fetch');
  return schedule;
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
  timezone?: string,
): Promise<DailyPrayerSchedule> {
  if (!(methodKey in ALADHAN_CALCULATION_METHODS) || !(schoolKey in ALADHAN_ASR_METHODS)) throw new Error('Unsupported prayer calculation');
  signal?.throwIfAborted();
  const methodId = ALADHAN_CALCULATION_METHODS[methodKey as keyof typeof ALADHAN_CALCULATION_METHODS]?.id ?? 2;
  const schoolId = ALADHAN_ASR_METHODS[schoolKey as keyof typeof ALADHAN_ASR_METHODS]?.id ?? 1;

  const cacheKey = `prayers_${lat.toFixed(3)}_${lng.toFixed(3)}_${dateStr}_${methodId}_${schoolId}`;
  
  const contextKey = JSON.stringify([lat, lng, dateStr, methodKey, schoolKey, timezone ?? null]);
  const cached = readContextCache(cacheKey, contextKey, z.unknown());
  if (cached) {
    try {
      const schedule = deserializeSchedule(cached.data);
      if (schedule.gregorianDate !== dateStr || schedule.calculationMethod !== methodKey || schedule.asrMethod !== schoolKey.toLowerCase()) throw new Error('Mismatched schedule');
      return { ...schedule, provenance: { successfulFetchAt: schedule.provenance?.successfulFetchAt ?? cached.fetchedAt, origin: 'cache' } };
    } catch { cacheService.clearKey(cacheKey); }
  }

  // Live fetch from AlAdhan API
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${methodId}&school=${schoolId}`;
  return withRequestDeadline(async (requestSignal) => {
  const res = await fetch(url, { signal: requestSignal });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const json = AladhanEnvelopeSchema.parse(await res.json());
  if (json.code !== 200 || !json.data) {
    throw new Error(`AlAdhan API error: ${json.status || 'Invalid response format'}`);
  }

  const schedule = deserializeSchedule(parseAladhanResponse(json.data, methodKey, schoolKey));
  if (schedule.gregorianDate !== dateStr) throw new Error('Mismatched prayer date');
  requestSignal.throwIfAborted();
  schedule.provenance = { successfulFetchAt: new Date().toISOString(), origin: 'network' };
  
  // Cache for 24 hours
  cacheService.setCache(cacheKey, { contextKey, value: schedule }, 24 * 60 * 60 * 1000);

  return schedule;
  }, signal);
}
