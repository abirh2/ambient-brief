import { apiFetch } from '../../../lib/api/apiClient';
import { AppLocation, TemperatureUnit, TimeFormat, WeatherData, HourlyForecast } from '../../../lib/types';
import { OpenMeteoForecastResponseSchema } from './openMeteoSchemas';
import { mapWeatherCode } from '../utils/weatherCodeMapper';
import { generateWeatherInsight } from '../utils/weatherInsight';
import { CurrentWeatherNormalized, HourlyWeatherNormalized } from '../types/weather';

export interface FetchOpenMeteoOptions {
  unit?: TemperatureUnit;
  timeFormat?: TimeFormat;
  signal?: AbortSignal;
}

/**
 * Builds the Open-Meteo forecast endpoint URL
 */
export function buildOpenMeteoUrl(location: AppLocation, unit: TemperatureUnit = 'fahrenheit'): string {
  const isCelsius = unit === 'celsius';

  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    timezone: location.timezone && location.timezone !== 'UTC' ? location.timezone : 'auto',
    forecast_days: '2',
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,is_day',
    hourly:
      'temperature_2m,apparent_temperature,precipitation_probability,weather_code,visibility,uv_index,wind_speed_10m',
    daily:
      'temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,weather_code',
    temperature_unit: isCelsius ? 'celsius' : 'fahrenheit',
    wind_speed_unit: isCelsius ? 'kmh' : 'mph',
    precipitation_unit: isCelsius ? 'mm' : 'inch',
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/**
 * Formats a raw hourly ISO timestamp (e.g. "2026-07-29T16:00") into display hour ("4 PM" or "16:00")
 */
export function formatHourlyTimeLabel(isoStr: string, timeFormat: TimeFormat = '12h'): string {
  const parts = isoStr.split('T');
  if (parts.length < 2) return isoStr;
  const hourPart = parts[1].split(':')[0];
  const hours = parseInt(hourPart, 10);
  if (isNaN(hours)) return isoStr;

  if (timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:00`;
  }
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12} ${ampm}`;
}

/**
 * Formats sunrise/sunset ISO string (e.g. "2026-07-29T06:04") into "6:04 AM" or "06:04"
 */
export function formatSunTime(isoStr: string, timeFormat: TimeFormat = '12h'): string {
  const parts = isoStr.split('T');
  if (parts.length < 2) return isoStr;
  const timeParts = parts[1].split(':');
  const hours = parseInt(timeParts[0], 10);
  const mins = parseInt(timeParts[1], 10);
  if (isNaN(hours) || isNaN(mins)) return isoStr;

  const minsStr = String(mins).padStart(2, '0');
  if (timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:${minsStr}`;
  }
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${minsStr} ${ampm}`;
}

/**
 * Fetches live weather forecast from Open-Meteo and normalizes it to App WeatherData
 */
export async function fetchOpenMeteoWeather(
  location: AppLocation,
  options: FetchOpenMeteoOptions = {}
): Promise<WeatherData> {
  const unit = options.unit ?? 'fahrenheit';
  const timeFormat = options.timeFormat ?? '12h';
  const url = buildOpenMeteoUrl(location, unit);

  const rawResponse = await apiFetch(url, {
    schema: OpenMeteoForecastResponseSchema,
    signal: options.signal,
    retries: 2,
    timeoutMs: 8000,
  });

  const { current, hourly, daily, utc_offset_seconds } = rawResponse;

  const currentMapping = mapWeatherCode(current.weather_code, current.is_day === 1);

  // Find start index in hourly forecast (closest to current time) using the location's offset
  const nowMs = Date.now();
  const locationLocalTimeMs = nowMs + utc_offset_seconds * 1000;

  let startIndex = 0;
  if (hourly.time && hourly.time.length > 0) {
    const foundIdx = hourly.time.findIndex((timeStr) => {
      const hourlyLocalTimeMs = new Date(timeStr + 'Z').getTime();
      return hourlyLocalTimeMs >= locationLocalTimeMs - 45 * 60 * 1000;
    });
    if (foundIdx !== -1) {
      startIndex = foundIdx;
    }
  }

  // Slice next 8 hours for timeline
  const next8Times = hourly.time.slice(startIndex, startIndex + 8);
  const normalizedHourlyList: HourlyWeatherNormalized[] = next8Times.map((isoTime, idx) => {
    const arrayIdx = startIndex + idx;
    const weatherCode = hourly.weather_code[arrayIdx] ?? 0;
    const mapping = mapWeatherCode(weatherCode, current.is_day === 1);

    return {
      time: formatHourlyTimeLabel(isoTime, timeFormat),
      isoTime,
      temperature: Math.round(hourly.temperature_2m[arrayIdx] ?? current.temperature_2m),
      apparentTemperature: Math.round(
        hourly.apparent_temperature[arrayIdx] ?? current.apparent_temperature
      ),
      precipitationProbability: Math.round(
        hourly.precipitation_probability[arrayIdx] ?? 0
      ),
      weatherCode,
      condition: mapping.condition,
      conditionLabel: mapping.label,
      iconName: mapping.iconName,
      visibility: hourly.visibility?.[arrayIdx],
      uvIndex: hourly.uv_index?.[arrayIdx],
      windSpeed: Math.round(hourly.wind_speed_10m[arrayIdx] ?? current.wind_speed_10m),
    };
  });

  // Extract UV Index for current hour
  const currentUvIndex = Math.round(hourly.uv_index?.[startIndex] ?? 4);

  const normalizedCurrent: CurrentWeatherNormalized = {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidityPercent: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    windGust: current.wind_gusts_10m ? Math.round(current.wind_gusts_10m) : undefined,
    condition: currentMapping.condition,
    conditionLabel: currentMapping.label,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    high: Math.round(daily.temperature_2m_max[0] ?? current.temperature_2m),
    low: Math.round(daily.temperature_2m_min[0] ?? current.temperature_2m),
    sunrise: daily.sunrise[0] ? formatSunTime(daily.sunrise[0], timeFormat) : '06:00 AM',
    sunset: daily.sunset[0] ? formatSunTime(daily.sunset[0], timeFormat) : '08:00 PM',
    observedAt: new Date().toISOString(),
    effectVariant: currentMapping.effectVariant,
    iconName: currentMapping.iconName,
  };

  // Generate deterministic insight
  const summaryNote = generateWeatherInsight(normalizedCurrent, normalizedHourlyList, unit);

  // Map to WeatherData interface consumed by application UI
  const displayHourly: HourlyForecast[] = normalizedHourlyList.map((h) => ({
    time: h.time,
    temp: h.temperature,
    pop: h.precipitationProbability,
    iconName: h.iconName,
    isoTime: h.isoTime,
  }));

  const weatherData: WeatherData = {
    temperature: normalizedCurrent.temperature,
    feelsLike: normalizedCurrent.apparentTemperature,
    high: normalizedCurrent.high,
    low: normalizedCurrent.low,
    condition: normalizedCurrent.conditionLabel,
    iconName: normalizedCurrent.iconName,
    humidity: normalizedCurrent.humidityPercent,
    windSpeedMph: normalizedCurrent.windSpeed,
    aqi: 22, // Nominal air quality index baseline
    uvIndex: currentUvIndex,
    summaryNote,
    hourly: displayHourly,
    sunrise: daily.sunrise[0],
    sunset: daily.sunset[0],
    isDay: current.is_day === 1,
    timezone: location.timezone,
  };

  return weatherData;
}
