import { apiFetch } from '../../../lib/api/apiClient';
import { AppLocation, TemperatureUnit, TimeFormat, WeatherData, HourlyForecast } from '../../../lib/types';
import { OpenMeteoForecastResponseSchema } from './openMeteoSchemas';
import { mapWeatherCode } from '../utils/weatherCodeMapper';
import { generateWeatherInsight } from '../utils/weatherInsight';
import { CurrentWeatherNormalized, HourlyWeatherNormalized } from '../types/weather';
import { formatHourlyTimeLabel, formatSunTime } from '../../../lib/formatting';

export { formatHourlyTimeLabel, formatSunTime } from '../../../lib/formatting';

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
    timezone: 'auto',
    forecast_days: '2',
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    hourly:
      'temperature_2m,precipitation_probability,weather_code,uv_index',
    daily:
      'temperature_2m_max,temperature_2m_min,sunrise,sunset',
    temperature_unit: isCelsius ? 'celsius' : 'fahrenheit',
    wind_speed_unit: isCelsius ? 'kmh' : 'mph',
    precipitation_unit: isCelsius ? 'mm' : 'inch',
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
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
    const mapping = mapWeatherCode(
      weatherCode,
      isTimeDuringDay(isoTime, daily.sunrise, daily.sunset, current.is_day === 1)
    );

    return {
      time: formatHourlyTimeLabel(isoTime, timeFormat),
      isoTime,
      temperature: Math.round(hourly.temperature_2m[arrayIdx] ?? current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      precipitationProbability: Math.round(
        hourly.precipitation_probability[arrayIdx] ?? 0
      ),
      weatherCode,
      condition: mapping.condition,
      conditionLabel: mapping.label,
      iconName: mapping.iconName,
      uvIndex: hourly.uv_index?.[arrayIdx],
      windSpeed: Math.round(current.wind_speed_10m),
    };
  });

  // Extract UV Index for current hour
  const currentUvValue = hourly.uv_index[startIndex];
  const currentUvIndex = currentUvValue === undefined ? null : Math.round(currentUvValue);

  const normalizedCurrent: CurrentWeatherNormalized = {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidityPercent: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    condition: currentMapping.condition,
    conditionLabel: currentMapping.label,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    high: Math.round(daily.temperature_2m_max[0] ?? current.temperature_2m),
    low: Math.round(daily.temperature_2m_min[0] ?? current.temperature_2m),
    sunrise: formatSunTime(daily.sunrise[0], timeFormat),
    sunset: formatSunTime(daily.sunset[0], timeFormat),
    observedAt: current.time,
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
    windSpeed: normalizedCurrent.windSpeed,
    windSpeedUnit: isCelsiusUnit(unit) ? 'km/h' : 'mph',
    uvIndex: currentUvIndex,
    summaryNote,
    hourly: displayHourly,
    sunrise: daily.sunrise[0],
    sunset: daily.sunset[0],
    isDay: current.is_day === 1,
    timezone: rawResponse.timezone,
  };

  return weatherData;
}

function isCelsiusUnit(unit: TemperatureUnit): boolean {
  return unit === 'celsius';
}

export function isTimeDuringDay(
  isoTime: string,
  sunrises: string[],
  sunsets: string[],
  fallback: boolean
): boolean {
  const date = isoTime.split('T')[0];
  const dayIndex = sunrises.findIndex((sunrise) => sunrise.startsWith(`${date}T`));
  if (dayIndex < 0 || !sunsets[dayIndex]) return fallback;
  return isoTime >= sunrises[dayIndex] && isoTime < sunsets[dayIndex];
}
