import { z } from 'zod';

export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction?: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
  certainty: string;
  urgency: string;
  status: string;
  messageType: string;
  areaDescription: string;
  effective?: string;
  onset?: string;
  expires?: string;
  ends?: string;
  senderName?: string;
  source: 'National Weather Service';
}

export const WeatherAlertSchema = z.object({
  id: z.string().min(1), event: z.string(), headline: z.string(), description: z.string(), instruction: z.string().optional(),
  severity: z.enum(['minor', 'moderate', 'severe', 'extreme', 'unknown']), certainty: z.string(), urgency: z.string(), status: z.string(), messageType: z.string(), areaDescription: z.string(),
  effective: z.string().optional(), onset: z.string().optional(), expires: z.string().optional(), ends: z.string().optional(), senderName: z.string().optional(), source: z.literal('National Weather Service'),
});
