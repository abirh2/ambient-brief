import { format } from 'date-fns';
import { TimeFormat } from '../types';

export function formatClockTime(date: Date, timeFormat: TimeFormat): string {
  if (timeFormat === '24h') {
    return format(date, 'HH:mm:ss');
  }
  return format(date, 'h:mm:ss a');
}

export function formatHeaderDate(date: Date, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone,
    }).format(date);
  } catch {
    return format(date, 'EEEE, MMMM d, yyyy');
  }
}

export interface ClockParts {
  hours: string;
  minutes: string;
  seconds: string;
  period?: string;
}

export function formatClockParts(date: Date, timeFormat: TimeFormat, timeZone?: string): ClockParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
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
}

export function formatShortTime(value: Date | string, timeFormat: TimeFormat = '12h'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  }).format(date);
}

export function formatDateTime(value: Date | string, timeFormat: TimeFormat = '12h'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    hour12: timeFormat === '12h',
  }).format(date);
}

export function formatRelativeTime(dateStringOrIso: string): string {
  const date = new Date(dateStringOrIso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const deltaSeconds = (date.getTime() - Date.now()) / 1_000;
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
