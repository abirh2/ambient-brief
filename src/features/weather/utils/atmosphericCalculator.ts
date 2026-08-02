import { TimeOfDayVariant, WeatherEffectVariant } from '../../../lib/types';

/**
 * Centralized helper to compute location-local time components in a given timezone.
 */
export function getLocalTimeComponents(timezone?: string, date: Date = new Date()) {
  try {
    const tz = timezone && timezone !== 'auto' ? timezone : undefined;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => {
      const p = parts.find((pt) => pt.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };
    const hour = getPart('hour') % 24;
    const minute = getPart('minute');
    return { hour, minute, minutesFromMidnight: hour * 60 + minute };
  } catch {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return { hour, minute, minutesFromMidnight: hour * 60 + minute };
  }
}

/**
 * Parses sunrise or sunset string into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1];
    if (timePart) {
      const parts = timePart.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return h * 60 + m;
      }
    }
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  return null;
}

/**
 * Derives time of day (morning, day, sunset, night) based on location-local time, sunrise, and sunset.
 * Suggested behavior:
 * - Morning: sunrise through approximately two hours after sunrise
 * - Day: after morning until approximately one hour before sunset
 * - Sunset: approximately one hour before until one hour after sunset
 * - Night: remaining time
 * Fallback centralized behavior for missing sunrise/sunset or invalid times.
 */
export function deriveTimeOfDay(
  timezone?: string,
  sunrise?: string,
  sunset?: string,
  now: Date = new Date()
): TimeOfDayVariant {
  const local = getLocalTimeComponents(timezone, now);
  const currentMins = local.minutesFromMidnight;

  const sunriseMins = parseTimeToMinutes(sunrise);
  const sunsetMins = parseTimeToMinutes(sunset);

  if (sunriseMins === null || sunsetMins === null) {
    const hour = local.hour;
    if (hour >= 5 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
  }

  const morningEnd = sunriseMins + 120;
  const sunsetStart = sunsetMins - 60;
  const sunsetEnd = sunsetMins + 60;

  if (currentMins >= sunriseMins && currentMins < morningEnd) {
    return 'morning';
  }
  if (currentMins >= sunsetStart && currentMins <= sunsetEnd) {
    return 'sunset';
  }
  if (currentMins >= morningEnd && currentMins < sunsetStart) {
    return 'day';
  }
  return 'night';
}

/**
 * Maps normalized weather condition string to WeatherEffectVariant.
 * Provider numeric codes must not reach the background components.
 */
export function deriveWeatherEffect(condition?: string): WeatherEffectVariant {
  if (!condition) return 'clear';
  const cond = condition.toLowerCase();
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('drizzle')) return 'rain';
  if (cond.includes('snow') || cond.includes('flurry') || cond.includes('sleet')) return 'snow';
  if (cond.includes('thunder') || cond.includes('storm')) return 'storm';
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) return 'fog';
  if (cond.includes('cloud') || cond.includes('overcast')) return 'cloudy';
  return 'clear';
}
