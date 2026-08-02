import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildOpenMeteoUrl,
  fetchOpenMeteoWeather,
  formatHourlyTimeLabel,
} from '../openMeteoWeatherProvider';
import { AppLocation } from '../../../../lib/types';

describe('openMeteoWeatherProvider', () => {
  const sampleLocation: AppLocation = {
    id: 'loc-philly',
    name: 'Philadelphia',
    latitude: 39.9526,
    longitude: -75.1652,
    timezone: 'America/New_York',
    country: 'United States',
    countryCode: 'US',
    source: 'saved',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds valid Open-Meteo endpoint URL in Fahrenheit mode', () => {
    const url = buildOpenMeteoUrl(sampleLocation, 'fahrenheit');
    expect(url).toContain('api.open-meteo.com/v1/forecast');
    expect(url).toContain('latitude=39.9526');
    expect(url).toContain('longitude=-75.1652');
    expect(url).toContain('temperature_unit=fahrenheit');
    expect(url).toContain('wind_speed_unit=mph');
    expect(url).toContain('precipitation_unit=inch');
  });

  it('builds valid Open-Meteo endpoint URL in Celsius mode', () => {
    const url = buildOpenMeteoUrl(sampleLocation, 'celsius');
    expect(url).toContain('temperature_unit=celsius');
    expect(url).toContain('wind_speed_unit=kmh');
    expect(url).toContain('precipitation_unit=mm');
  });

  it('formats hourly ISO timestamp into 12h and 24h labels correctly', () => {
    const isoStr = '2026-07-29T15:00';
    expect(formatHourlyTimeLabel(isoStr, '12h')).toMatch(/3 PM|15:00/);
    expect(formatHourlyTimeLabel(isoStr, '24h')).toBe('15:00');
  });

  it('fetches and normalizes Open-Meteo forecast API response', async () => {
    // Generate 24 hourly timestamps around current time
    const baseDate = new Date();
    baseDate.setMinutes(0, 0, 0);

    const hourlyTimes: string[] = [];
    const hourlyTemps: number[] = [];
    const hourlyApparent: number[] = [];
    const hourlyPops: number[] = [];
    const hourlyCodes: number[] = [];
    const hourlyVisibility: number[] = [];
    const hourlyUv: number[] = [];
    const hourlyWind: number[] = [];

    for (let i = -2; i < 22; i++) {
      const d = new Date(baseDate.getTime() + i * 3600 * 1000);
      const isoStr = d.toISOString().slice(0, 16);
      hourlyTimes.push(isoStr);
      hourlyTemps.push(75 + i);
      hourlyApparent.push(76 + i);
      hourlyPops.push(i % 2 === 0 ? 10 : 0);
      hourlyCodes.push(2);
      hourlyVisibility.push(10000);
      hourlyUv.push(i > 0 && i < 6 ? 6 : 0);
      hourlyWind.push(8);
    }

    const mockApiResponse = {
      latitude: 39.95,
      longitude: -75.16,
      utc_offset_seconds: -14400,
      timezone: 'America/New_York',
      current: {
        temperature_2m: 78.4,
        apparent_temperature: 80.1,
        relative_humidity_2m: 55,
        weather_code: 2,
        wind_speed_10m: 9.2,
        wind_gusts_10m: 14.5,
        is_day: 1,
      },
      hourly: {
        time: hourlyTimes,
        temperature_2m: hourlyTemps,
        apparent_temperature: hourlyApparent,
        precipitation_probability: hourlyPops,
        weather_code: hourlyCodes,
        visibility: hourlyVisibility,
        uv_index: hourlyUv,
        wind_speed_10m: hourlyWind,
      },
      daily: {
        time: ['2026-07-29', '2026-07-30'],
        temperature_2m_max: [82.1, 84.0],
        temperature_2m_min: [64.5, 66.0],
        sunrise: ['2026-07-29T06:01', '2026-07-30T06:02'],
        sunset: ['2026-07-29T20:22', '2026-07-30T20:21'],
        precipitation_probability_max: [20, 30],
        weather_code: [2, 3],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
      headers: new Headers(),
    } as unknown as Response);

    const weatherData = await fetchOpenMeteoWeather(sampleLocation, {
      unit: 'fahrenheit',
      timeFormat: '12h',
    });

    expect(weatherData.temperature).toBe(78);
    expect(weatherData.feelsLike).toBe(80);
    expect(weatherData.high).toBe(82);
    expect(weatherData.low).toBe(65);
    expect(weatherData.condition).toBe('Partly Cloudy');
    expect(weatherData.hourly).toHaveLength(8);
  });
});
