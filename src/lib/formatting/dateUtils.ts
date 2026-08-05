import type { TimeFormat } from '../types';

const DEFAULT_LOCALE = 'en-US';

export interface DisplayTimeOptions {
  timeFormat: TimeFormat;
  timeZone?: string;
  includeSeconds?: boolean;
  /** Use for provider values that represent a wall-clock time without an offset. */
  wallTime?: boolean;
}

export interface ClockParts {
  hours: string;
  minutes: string;
  seconds: string;
  period?: string;
}

/**
 * The single formatter for user-visible clock times. Instant values are rendered
 * in the selected location's IANA timezone; provider-local wall times can be
 * explicitly interpreted in that timezone.
 */
export function formatDisplayTime(
  value: Date | string,
  options: DisplayTimeOptions,
): string {
  const effectiveTimeZone = options.wallTime ? options.timeZone ?? 'UTC' : options.timeZone;
  const date = coerceDisplayDate(value, effectiveTimeZone, options.wallTime ?? false);
  if (!date) return 'Unknown time';

  try {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      hour: options.timeFormat === '24h' ? '2-digit' : 'numeric',
      minute: '2-digit',
      ...(options.includeSeconds ? { second: '2-digit' as const } : {}),
      hourCycle: options.timeFormat === '24h' ? 'h23' : 'h12',
      timeZone: effectiveTimeZone,
    }).format(date);
  } catch {
    return 'Unknown time';
  }
}

export function formatClockParts(
  date: Date,
  timeFormat: TimeFormat,
  timeZone?: string,
): ClockParts {
  try {
    const parts = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      hour: timeFormat === '24h' ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: timeFormat === '24h' ? 'h23' : 'h12',
      timeZone,
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    return {
      hours: value('hour'),
      minutes: value('minute'),
      seconds: value('second'),
      period: value('dayPeriod') || undefined,
    };
  } catch {
    return { hours: '--', minutes: '--', seconds: '--' };
  }
}

/** Always formats the primary header date in the Gregorian calendar. */
export function formatHeaderDate(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      calendar: 'gregory',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone,
    }).format(date);
  } catch {
    return 'Date unavailable';
  }
}

export function formatDisplayDateTime(
  value: Date | string,
  options: Omit<DisplayTimeOptions, 'includeSeconds'> & { weekday?: boolean },
): string {
  const effectiveTimeZone = options.wallTime ? options.timeZone ?? 'UTC' : options.timeZone;
  const date = coerceDisplayDate(value, effectiveTimeZone, options.wallTime ?? false);
  if (!date) return 'Unknown time';
  try {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      ...(options.weekday ? { weekday: 'short' as const } : {}),
      month: 'short',
      day: 'numeric',
      year: options.weekday ? undefined : 'numeric',
      hour: options.timeFormat === '24h' ? '2-digit' : 'numeric',
      minute: '2-digit',
      hourCycle: options.timeFormat === '24h' ? 'h23' : 'h12',
      timeZone: effectiveTimeZone,
    }).format(date);
  } catch {
    return 'Unknown time';
  }
}

export function formatShortTime(
  value: Date | string,
  timeFormat: TimeFormat = '12h',
  timeZone?: string,
): string {
  return formatDisplayTime(value, { timeFormat, timeZone });
}

export function formatDateTime(
  value: Date | string,
  timeFormat: TimeFormat = '12h',
  timeZone?: string,
): string {
  return formatDisplayDateTime(value, { timeFormat, timeZone });
}

export function formatRelativeTime(dateStringOrIso: string, now = Date.now()): string {
  const date = new Date(dateStringOrIso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  const deltaSeconds = (date.getTime() - now) / 1_000;
  const absoluteSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (absoluteSeconds < 60) return formatter.format(Math.round(deltaSeconds), 'second');
  if (absoluteSeconds < 3_600) return formatter.format(Math.round(deltaSeconds / 60), 'minute');
  if (absoluteSeconds < 86_400) return formatter.format(Math.round(deltaSeconds / 3_600), 'hour');
  return formatter.format(Math.round(deltaSeconds / 86_400), 'day');
}

export function formatNewsTimestamp(dateStringOrIso: string): string {
  return formatRelativeTime(dateStringOrIso);
}

export function createDateInTimeZone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let candidate = new Date(wallClockUtc);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getTimeZoneOffset(candidate, timeZone);
    const corrected = new Date(wallClockUtc - offset);
    if (corrected.getTime() === candidate.getTime()) return corrected;
    candidate = corrected;
  }
  return candidate;
}

function coerceDisplayDate(value: Date | string, timeZone?: string, wallTime = false): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (wallTime) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match || !timeZone) return null;
    const [, year, month, day, hour, minute] = match;
    return createDateInTimeZone(Number(year), Number(month), Number(day), Number(hour), Number(minute), timeZone);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day),
    Number(values.hour), Number(values.minute), Number(values.second),
  );
  return asUtc - date.getTime();
}
