import { WeatherEffectVariant } from '../../../lib/types';

export type SemanticCondition =
  | 'clear'
  | 'mostly-clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'freezing-rain'
  | 'snow'
  | 'snow-showers'
  | 'thunderstorm'
  | 'thunderstorm-hail'
  | 'unknown';

export interface WeatherCodeMapping {
  condition: SemanticCondition;
  label: string;
  iconName: string;
  effectVariant: WeatherEffectVariant;
  description: string;
}

export interface CurrentWeatherNormalized {
  temperature: number;
  apparentTemperature: number;
  humidityPercent: number;
  windSpeed: number;
  windGust?: number;
  condition: SemanticCondition;
  conditionLabel: string;
  weatherCode: number;
  isDay: boolean;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  observedAt: string;
  effectVariant: WeatherEffectVariant;
  iconName: string;
}

export interface HourlyWeatherNormalized {
  time: string; // Formatted time string e.g. "3 PM" or "15:00"
  isoTime: string; // Raw ISO timestamp e.g. "2026-07-29T16:00"
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
  condition: SemanticCondition;
  conditionLabel: string;
  iconName: string;
  visibility?: number;
  uvIndex?: number;
  windSpeed: number;
}

export interface DailyWeatherNormalized {
  date: string;
  maxTemp: number;
  minTemp: number;
  sunrise: string;
  sunset: string;
  maxPrecipitationProbability: number;
  weatherCode: number;
}
