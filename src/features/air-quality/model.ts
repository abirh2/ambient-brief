export type AirQualityCategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for sensitive groups'
  | 'Unhealthy'
  | 'Very unhealthy'
  | 'Hazardous'
  | 'Unknown';

export interface HourlyAirQuality {
  time: string;
  isoTime: string;
  usAqi: number;
  pm25?: number;
  pm10?: number;
  ozone?: number;
}

export interface AirQualitySnapshot {
  usAqi: number | null;
  category: AirQualityCategory;
  pm25?: number;
  pm10?: number;
  ozone?: number;
  measuredAt: string;
  hourly: HourlyAirQuality[];
  pollen?: { alder?: number; birch?: number; grass?: number };
}
