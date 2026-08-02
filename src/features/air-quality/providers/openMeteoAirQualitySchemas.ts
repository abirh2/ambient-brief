import { z } from 'zod';

export const OpenMeteoAirQualityCurrentSchema = z.object({
  time: z.string(),
  interval: z.number().optional(),
  us_aqi: z.number().nullable().optional(),
  pm2_5: z.number().nullable().optional(),
  pm10: z.number().nullable().optional(),
  ozone: z.number().nullable().optional(),
});

export const OpenMeteoAirQualityHourlySchema = z.object({
  time: z.array(z.string()),
  us_aqi: z.array(z.number().nullable().optional()).optional().default([]),
  pm2_5: z.array(z.number().nullable().optional()).optional().default([]),
  pm10: z.array(z.number().nullable().optional()).optional().default([]),
  ozone: z.array(z.number().nullable().optional()).optional().default([]),
  alder_pollen: z.array(z.number().nullable().optional()).optional().default([]),
  birch_pollen: z.array(z.number().nullable().optional()).optional().default([]),
  grass_pollen: z.array(z.number().nullable().optional()).optional().default([]),
});

export const OpenMeteoAirQualityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number().default(0),
  timezone: z.string().default('UTC'),
  timezone_abbreviation: z.string().optional(),
  current: OpenMeteoAirQualityCurrentSchema,
  hourly: OpenMeteoAirQualityHourlySchema,
});

export type OpenMeteoAirQualityResponse = z.infer<typeof OpenMeteoAirQualityResponseSchema>;
