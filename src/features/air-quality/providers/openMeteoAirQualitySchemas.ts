import { z } from 'zod';

export const OpenMeteoAirQualityCurrentSchema = z.object({
  time: z.string(),
  interval: z.number().optional(),
  us_aqi: z.number().nullable().optional(),
  pm2_5: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  ozone: z.number().nullable().optional(),
}).refine(
  (current) => [current.us_aqi, current.pm2_5, current.pm10, current.ozone].some(
    (value) => value !== null && value !== undefined
  ),
  { message: 'Air-quality response did not include any requested current values.' }
);

export const OpenMeteoAirQualityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number().default(0),
  timezone: z.string().default('UTC'),
  timezone_abbreviation: z.string().optional(),
  current: OpenMeteoAirQualityCurrentSchema,
});

export type OpenMeteoAirQualityResponse = z.infer<typeof OpenMeteoAirQualityResponseSchema>;
