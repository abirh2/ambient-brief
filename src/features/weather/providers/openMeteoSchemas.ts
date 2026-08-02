import { z } from 'zod';

export const OpenMeteoCurrentSchema = z.object({
  time: z.string(),
  temperature_2m: z.number(),
  apparent_temperature: z.number(),
  relative_humidity_2m: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  is_day: z.union([z.literal(0), z.literal(1)]),
});

export const OpenMeteoHourlySchema = z.object({
  time: z.array(z.string()).min(1),
  temperature_2m: z.array(z.number()).min(1),
  precipitation_probability: z.array(z.number()).min(1),
  weather_code: z.array(z.number()).min(1),
  uv_index: z.array(z.number()).min(1),
}).superRefine((hourly, context) => {
  const expectedLength = hourly.time.length;
  const series = [
    hourly.temperature_2m,
    hourly.precipitation_probability,
    hourly.weather_code,
    hourly.uv_index,
  ];
  if (series.some((values) => values.length !== expectedLength)) {
    context.addIssue({
      code: 'custom',
      message: 'Hourly forecast arrays must align with the time array.',
    });
  }
});

export const OpenMeteoDailySchema = z.object({
  time: z.array(z.string()).min(1),
  temperature_2m_max: z.array(z.number()).min(1),
  temperature_2m_min: z.array(z.number()).min(1),
  sunrise: z.array(z.string()).min(1),
  sunset: z.array(z.string()).min(1),
}).superRefine((daily, context) => {
  const expectedLength = daily.time.length;
  const series = [
    daily.temperature_2m_max,
    daily.temperature_2m_min,
    daily.sunrise,
    daily.sunset,
  ];
  if (series.some((values) => values.length !== expectedLength)) {
    context.addIssue({
      code: 'custom',
      message: 'Daily forecast arrays must align with the time array.',
    });
  }
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
