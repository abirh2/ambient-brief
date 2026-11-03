import { z } from 'zod';

export type TemperatureUnit = 'fahrenheit' | 'celsius';

export interface HourlyForecast {
  time: string;
  temp: number;
  pop: number;
  iconName: string;
  isoTime?: string;
}

export interface WeatherData {
  observedAt?: string;
  weatherCode?: number;
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
  condition: string;
  iconName: string;
  humidity: number;
  windSpeed: number;
  windSpeedUnit: 'mph' | 'km/h';
  uvIndex: number | null;
  summaryNote?: string;
  hourly: HourlyForecast[];
  sunrise?: string;
  sunset?: string;
  isDay?: boolean;
  timezone?: string;
}

export type WeatherState =
  | { status: 'loaded'; data: WeatherData }
  | { status: 'loading' }
  | { status: 'permission_denied'; message?: string }
  | { status: 'location_unavailable'; message?: string }
  | { status: 'cached'; data: WeatherData; lastUpdatedText: string };

export type WeatherStateStatus = WeatherState['status'];

export const WeatherDataSchema = z.object({
  observedAt: z.string().optional(), weatherCode: z.number().finite().optional(),
  temperature: z.number().finite(), feelsLike: z.number().finite(), high: z.number().finite(), low: z.number().finite(),
  condition: z.string(), iconName: z.string(), humidity: z.number().finite().min(0).max(100),
  windSpeed: z.number().finite().nonnegative(), windSpeedUnit: z.enum(['mph', 'km/h']), uvIndex: z.number().finite().nonnegative().nullable(),
  hourly: z.array(z.object({ time: z.string(), temp: z.number().finite(), pop: z.number().min(0).max(100), iconName: z.string(), isoTime: z.string().optional() })).min(1),
  summaryNote: z.string().optional(), sunrise: z.string().optional(), sunset: z.string().optional(), isDay: z.boolean().optional(), timezone: z.string().optional(),
});
