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
  try {
    const date = new Date(dateStringOrIso);
    if (isNaN(date.getTime())) return 'Unknown time';
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
}
