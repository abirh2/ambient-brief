import { apiFetch } from '../../../lib/api/apiClient';
import { AppLocation } from '../../../lib/types';
import { AirQualitySnapshot, HourlyAirQuality } from '../types';
import { OpenMeteoAirQualityResponseSchema } from './openMeteoAirQualitySchemas';
import { interpretAqi } from '../utils/aqiInterpreter';

export interface FetchAirQualityOptions {
  signal?: AbortSignal;
}

export function buildAirQualityUrl(location: AppLocation): string {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: 'us_aqi,pm2_5,pm10,ozone',
    hourly: 'us_aqi,pm2_5,pm10,ozone,alder_pollen,birch_pollen,grass_pollen',
    timezone: location.timezone && location.timezone !== 'UTC' ? location.timezone : 'auto',
    forecast_days: '2',
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
}

export async function fetchOpenMeteoAirQuality(
  location: AppLocation,
  options: FetchAirQualityOptions = {}
): Promise<AirQualitySnapshot> {
  const url = buildAirQualityUrl(location);

  const rawResponse = await apiFetch(url, {
    signal: options.signal,
    schema: OpenMeteoAirQualityResponseSchema,
    providerId: 'open_meteo_aqi',
    timeoutMs: 8000,
  });

  const { current, hourly, utc_offset_seconds } = rawResponse;

  const nowMs = Date.now();
  const locationLocalTimeMs = nowMs + utc_offset_seconds * 1000;

  let startIndex = 0;
  if (hourly.time && hourly.time.length > 0) {
    const foundIdx = hourly.time.findIndex((timeStr: string) => {
      const hourlyLocalTimeMs = new Date(timeStr + 'Z').getTime();
      return hourlyLocalTimeMs >= locationLocalTimeMs - 45 * 60 * 1000;
    });
    if (foundIdx !== -1) {
      startIndex = foundIdx;
    }
  }

  // Map pollen values from the current hour in hourly arrays
  const pollenAlder = hourly.alder_pollen?.[startIndex] ?? undefined;
  const pollenBirch = hourly.birch_pollen?.[startIndex] ?? undefined;
  const pollenGrass = hourly.grass_pollen?.[startIndex] ?? undefined;

  const pollenObj = (pollenAlder !== undefined || pollenBirch !== undefined || pollenGrass !== undefined)
    ? {
        alder: pollenAlder,
        birch: pollenBirch,
        grass: pollenGrass,
      }
    : undefined;

  // Build the hourly list
  const next24Times = hourly.time.slice(startIndex, startIndex + 24);
  const normalizedHourlyList: HourlyAirQuality[] = next24Times.map((isoTime: string, idx: number) => {
    const arrayIdx = startIndex + idx;
    return {
      time: formatHourlyTime(isoTime),
      isoTime,
      usAqi: Math.round(hourly.us_aqi?.[arrayIdx] ?? current.us_aqi ?? 0),
      pm25: hourly.pm2_5?.[arrayIdx] !== undefined && hourly.pm2_5?.[arrayIdx] !== null ? Math.round(hourly.pm2_5[arrayIdx]!) : undefined,
      pm10: hourly.pm10?.[arrayIdx] !== undefined && hourly.pm10?.[arrayIdx] !== null ? Math.round(hourly.pm10[arrayIdx]!) : undefined,
      ozone: hourly.ozone?.[arrayIdx] !== undefined && hourly.ozone?.[arrayIdx] !== null ? Math.round(hourly.ozone[arrayIdx]!) : undefined,
    };
  });

  const currentUsAqi = current.us_aqi !== null && current.us_aqi !== undefined ? Math.round(current.us_aqi) : null;
  const interpretation = interpretAqi(currentUsAqi);

  return {
    usAqi: currentUsAqi,
    category: interpretation.category,
    pm25: current.pm2_5 !== null && current.pm2_5 !== undefined ? Math.round(current.pm2_5) : undefined,
    pm10: current.pm10 !== null && current.pm10 !== undefined ? Math.round(current.pm10) : undefined,
    ozone: current.ozone !== null && current.ozone !== undefined ? Math.round(current.ozone) : undefined,
    measuredAt: new Date().toISOString(),
    hourly: normalizedHourlyList,
    pollen: pollenObj,
  };
}

function formatHourlyTime(isoStr: string): string {
  const parts = isoStr.split('T');
  if (parts.length < 2) return isoStr;
  const hourPart = parts[1].split(':')[0];
  const hours = parseInt(hourPart, 10);
  if (isNaN(hours)) return isoStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12} ${ampm}`;
}
