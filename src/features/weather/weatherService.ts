import { AppLocation, TemperatureUnit, WeatherData } from '../../lib/types';
import { fetchOpenMeteoWeather } from './providers/openMeteoWeatherProvider';

export async function fetchWeatherData(
  location: AppLocation,
  unit: TemperatureUnit = 'fahrenheit',
  signal?: AbortSignal
): Promise<WeatherData> {
  return fetchOpenMeteoWeather(location, { unit, signal });
}
