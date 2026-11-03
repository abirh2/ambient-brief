import { z } from 'zod';

export type AirQualityCategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for sensitive groups'
  | 'Unhealthy'
  | 'Very unhealthy'
  | 'Hazardous'
  | 'Unknown';

export interface AirQualitySnapshot {
  timezone?: string;
  usAqi: number | null;
  category: AirQualityCategory;
  pm25?: number;
  pm10?: number;
  ozone?: number;
  measuredAt: string;
}

export const AirQualitySnapshotSchema = z.object({
  timezone: z.string().optional(),
  usAqi: z.number().finite().nonnegative().nullable(), category: z.enum(['Good', 'Moderate', 'Unhealthy for sensitive groups', 'Unhealthy', 'Very unhealthy', 'Hazardous', 'Unknown']),
  pm25: z.number().finite().nonnegative().optional(), pm10: z.number().finite().nonnegative().optional(), ozone: z.number().finite().nonnegative().optional(), measuredAt: z.string(),
});
