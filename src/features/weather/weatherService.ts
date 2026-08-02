import { AppLocation, TemperatureUnit, WeatherData } from '../../lib/types';
import { fetchOpenMeteoWeather } from './providers/openMeteoWeatherProvider';
import { MOCK_WEATHER_DATA } from '../../lib/mocks/mockData';
import { WeatherDataSchema } from '../../lib/validation/schemas';

export async function fetchWeatherData(
  location: AppLocation,
  unit: TemperatureUnit = 'fahrenheit',
  signal?: AbortSignal
): Promise<WeatherData> {
  return fetchOpenMeteoWeather(location, { unit, signal });
}

export function fetchMockWeatherData(): WeatherData {
  const parsed = WeatherDataSchema.safeParse(MOCK_WEATHER_DATA);
  if (!parsed.success) {
    throw new Error('Invalid weather schema format');
  }
  return parsed.data;
}
