import type { TimeFormat } from '../../types';
import { formatDisplayTime } from './dateUtils';

export function formatHourlyTimeLabel(
  isoString: string,
  timeFormat: TimeFormat = '12h',
  timeZone?: string,
): string {
  return formatDisplayTime(isoString, { timeFormat, timeZone, wallTime: true });
}

export function formatSunTime(
  isoString: string,
  timeFormat: TimeFormat = '12h',
  timeZone?: string,
): string {
  return formatDisplayTime(isoString, { timeFormat, timeZone, wallTime: true });
}
