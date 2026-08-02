import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAirQualityUrl, fetchOpenMeteoAirQuality } from '../openMeteoAirQualityProvider';
import { AppLocation } from '../../../../lib/types';

describe('openMeteoAirQualityProvider', () => {
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

  it('builds valid Open-Meteo Air Quality endpoint URL', () => {
    const url = buildAirQualityUrl(sampleLocation);
    expect(url).toContain('air-quality-api.open-meteo.com/v1/air-quality');
    expect(url).toContain('latitude=39.9526');
    expect(url).toContain('longitude=-75.1652');
    expect(url).toContain('current=us_aqi%2Cpm2_5%2Cpm10%2Cozone');
    expect(new URL(url).searchParams.get('hourly')).toBeNull();
    expect(new URL(url).searchParams.get('timezone')).toBe('auto');
  });

  it('fetches and normalizes Open-Meteo Air Quality response', async () => {
    const baseDate = new Date();
    baseDate.setMinutes(0, 0, 0);

    const hourlyTimes: string[] = [];
    const hourlyAqi: number[] = [];
    const hourlyPm25: number[] = [];
    const hourlyPm10: number[] = [];
    const hourlyOzone: number[] = [];
    const hourlyAlder: number[] = [];
    const hourlyBirch: number[] = [];
    const hourlyGrass: number[] = [];

    for (let i = -2; i < 22; i++) {
      const d = new Date(baseDate.getTime() + i * 3600 * 1000);
      const isoStr = d.toISOString().slice(0, 16);
      hourlyTimes.push(isoStr);
      hourlyAqi.push(42 + i);
      hourlyPm25.push(9.5 + i);
      hourlyPm10.push(15.2 + i);
      hourlyOzone.push(64.0 + i);
      hourlyAlder.push(1.0);
      hourlyBirch.push(2.0);
      hourlyGrass.push(3.0);
    }

    const mockApiResponse = {
      latitude: 39.95,
      longitude: -75.16,
      utc_offset_seconds: -14400,
      timezone: 'America/New_York',
      current: {
        time: baseDate.toISOString().slice(0, 16),
        interval: 3600,
        us_aqi: 42,
        pm2_5: 9.5,
        pm10: 15.2,
        ozone: 64.0,
      },
      hourly: {
        time: hourlyTimes,
        us_aqi: hourlyAqi,
        pm2_5: hourlyPm25,
        pm10: hourlyPm10,
        ozone: hourlyOzone,
        alder_pollen: hourlyAlder,
        birch_pollen: hourlyBirch,
        grass_pollen: hourlyGrass,
      },
    };

    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      json: () => Promise.resolve(mockApiResponse),
    });
    global.fetch = mockFetch;

    const result = await fetchOpenMeteoAirQuality(sampleLocation);

    expect(result.usAqi).toBe(42);
    expect(result.category).toBe('Good');
    expect(result.pm25).toBe(10); // Rounded 9.5
    expect(result.pm10).toBe(15); // Rounded 15.2
    expect(result.ozone).toBe(64); // Rounded 64.0
    expect(result.measuredAt).toBe(baseDate.toISOString().slice(0, 16));
  });

  it('rejects a response with no requested current values', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        latitude: 39.95,
        longitude: -75.16,
        utc_offset_seconds: -14400,
        timezone: 'America/New_York',
        current: {
          time: '2026-07-29T12:00',
          us_aqi: null,
          pm2_5: null,
          pm10: null,
          ozone: null,
        },
      }),
    } as Response);

    await expect(fetchOpenMeteoAirQuality(sampleLocation)).rejects.toMatchObject({
      code: 'invalid-response',
    });
  });
});
