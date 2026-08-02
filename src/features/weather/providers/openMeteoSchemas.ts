import { z } from 'zod';

export const OpenMeteoCurrentSchema = z.object({
  temperature_2m: z.number(),
  apparent_temperature: z.number(),
  relative_humidity_2m: z.number().default(0),
  weather_code: z.number().default(0),
  wind_speed_10m: z.number().default(0),
  wind_gusts_10m: z.number().optional().default(0),
  is_day: z.number().default(1),
});

export const OpenMeteoHourlySchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number()),
  apparent_temperature: z.array(z.number()),
  precipitation_probability: z.array(z.number()).default([]),
  weather_code: z.array(z.number()),
  visibility: z.array(z.number()).optional().default([]),
  uv_index: z.array(z.number()).optional().default([]),
  wind_speed_10m: z.array(z.number()).default([]),
});

export const OpenMeteoDailySchema = z.object({
  time: z.array(z.string()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
  sunrise: z.array(z.string()).default([]),
  sunset: z.array(z.string()).default([]),
  precipitation_probability_max: z.array(z.number()).optional().default([]),
  weather_code: z.array(z.number()).default([]),
});

export const OpenMeteoForecastResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  utc_offset_seconds: z.number().default(0),
  timezone: z.string().default('UTC'),
  timezone_abbreviation: z.string().optional(),
  current: OpenMeteoCurrentSchema,
  hourly: OpenMeteoHourlySchema,
  daily: OpenMeteoDailySchema,
});

export type OpenMeteoForecastResponse = z.infer<typeof OpenMeteoForecastResponseSchema>;
