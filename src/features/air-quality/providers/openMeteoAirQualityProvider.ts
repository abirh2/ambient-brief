import { apiFetch } from '../../../lib/api/apiClient';
import { AppLocation } from '../../../lib/types';
import { AirQualitySnapshot } from '../types';
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
    timezone: 'auto',
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

  const { current } = rawResponse;

  const currentUsAqi = current.us_aqi !== null && current.us_aqi !== undefined ? Math.round(current.us_aqi) : null;
  const interpretation = interpretAqi(currentUsAqi);

  return {
    usAqi: currentUsAqi,
    category: interpretation.category,
    pm25: current.pm2_5 !== null && current.pm2_5 !== undefined ? Math.round(current.pm2_5) : undefined,
    pm10: current.pm10 !== null && current.pm10 !== undefined ? Math.round(current.pm10) : undefined,
    ozone: current.ozone !== null && current.ozone !== undefined ? Math.round(current.ozone) : undefined,
    measuredAt: current.time,
  };
}
