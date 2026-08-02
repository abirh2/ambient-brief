import { format, formatDistanceToNow } from 'date-fns';
import { TimeFormat } from '../types';

export function formatClockTime(date: Date, timeFormat: TimeFormat): string {
  if (timeFormat === '24h') {
    return format(date, 'HH:mm:ss');
  }
  return format(date, 'h:mm:ss a');
}

export function formatHeaderDate(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

export interface ClockParts {
  hours: string;
  minutes: string;
  seconds: string;
  period?: string;
}

export function formatClockParts(date: Date, timeFormat: TimeFormat): ClockParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
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
  try {
    const date = new Date(dateStringOrIso);
    if (isNaN(date.getTime())) return 'Unknown time';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
}

export function formatNewsTimestamp(dateStringOrIso: string): string {
  return formatRelativeTime(dateStringOrIso);
}
