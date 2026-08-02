export type TemperatureUnit = 'fahrenheit' | 'celsius';

export interface HourlyForecast {
  time: string;
  temp: number;
  pop: number;
  iconName: string;
  isoTime?: string;
}

export interface WeatherData {
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
