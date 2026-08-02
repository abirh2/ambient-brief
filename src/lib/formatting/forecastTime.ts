import type { TimeFormat } from '../../types';

export function formatHourlyTimeLabel(isoString: string, timeFormat: TimeFormat = '12h'): string {
  const hour = Number.parseInt(isoString.split('T')[1]?.split(':')[0] ?? '', 10);
  if (Number.isNaN(hour)) return isoString;
  if (timeFormat === '24h') return `${String(hour).padStart(2, '0')}:00`;
  return `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function formatSunTime(isoString: string, timeFormat: TimeFormat = '12h'): string {
  const [hourString, minuteString] = isoString.split('T')[1]?.split(':') ?? [];
  const hour = Number.parseInt(hourString ?? '', 10);
  const minute = Number.parseInt(minuteString ?? '', 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return isoString;
  const minutes = String(minute).padStart(2, '0');
  if (timeFormat === '24h') return `${String(hour).padStart(2, '0')}:${minutes}`;
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
}
