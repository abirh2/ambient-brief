import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLocations, formatLocationLabel, formatCompactLocation } from '../geocodingService';
import { AppLocation } from '../../types';

describe('geocodingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when query is shorter than 2 characters', async () => {
    const results = await searchLocations('a');
    expect(results).toEqual([]);
  });

  it('successfully fetches and maps geocoding results from Open-Meteo', async () => {
    const mockApiResponse = {
      results: [
        {
          id: 5174828,
          name: 'Upper Darby',
          latitude: 39.9601,
          longitude: -75.2638,
          country_code: 'US',
          country: 'United States',
          admin1: 'Pennsylvania',
          timezone: 'America/New_York',
        },
        {
          id: 2643743,
          name: 'London',
          latitude: 51.5085,
          longitude: -0.1257,
          country_code: 'GB',
          country: 'United Kingdom',
          admin1: 'England',
          timezone: 'Europe/London',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
      headers: new Headers(),
    } as unknown as Response);

    const locations = await searchLocations('London');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(locations).toHaveLength(2);
    expect(locations[0]).toEqual({
      id: 'om-5174828',
      name: 'Upper Darby',
      admin1: 'Pennsylvania',
      country: 'United States',
      countryCode: 'US',
      latitude: 39.9601,
      longitude: -75.2638,
      timezone: 'America/New_York',
      source: 'search',
    });
  });

  it('handles empty results from API gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
      headers: new Headers(),
    } as unknown as Response);

    const results = await searchLocations('NonexistentplaceXYZ');
    expect(results).toEqual([]);
  });

  it('handles API errors without crashing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
    } as unknown as Response);

    try {
      await searchLocations('Philadelphia');
      expect.fail('Should have thrown an API error');
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }
  });

  it('formats full location display labels correctly', () => {
    const loc1: AppLocation = {
      id: 'loc-1',
      name: 'London',
      admin1: 'England',
      country: 'United Kingdom',
      countryCode: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
      source: 'search',
    };

    expect(formatLocationLabel(loc1)).toBe('London, England, United Kingdom');

    const deviceLoc: AppLocation = {
      id: 'dev-1',
      name: 'Upper Darby',
      admin1: 'Pennsylvania',
      country: 'United States',
      countryCode: 'US',
      latitude: 39.96,
      longitude: -75.26,
      timezone: 'America/New_York',
      source: 'device',
    };

    expect(formatLocationLabel(deviceLoc)).toBe('Upper Darby, Pennsylvania, United States');
  });

  it('formats compact location labels correctly', () => {
    const loc: AppLocation = {
      id: 'loc-2',
      name: 'Upper Darby',
      admin1: 'Pennsylvania',
      country: 'United States',
      countryCode: 'US',
      latitude: 39.96,
      longitude: -75.26,
      timezone: 'America/New_York',
      source: 'search',
    };

    expect(formatCompactLocation(loc)).toBe('Upper Darby, Pennsylvania');
  });
});
