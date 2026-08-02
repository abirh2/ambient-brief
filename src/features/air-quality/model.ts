export type AirQualityCategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for sensitive groups'
  | 'Unhealthy'
  | 'Very unhealthy'
  | 'Hazardous'
  | 'Unknown';

export interface AirQualitySnapshot {
  usAqi: number | null;
  category: AirQualityCategory;
  pm25?: number;
  pm10?: number;
  ozone?: number;
  measuredAt: string;
}
