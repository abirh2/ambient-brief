import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reverseGeocodeDeviceLocation } from '../reverseGeocodingService';

describe('reverseGeocodeDeviceLocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps a validated BigDataCloud response to the app location fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 39.9601,
        longitude: -75.2638,
        lookupSource: 'coordinates',
        city: 'Upper Darby',
        locality: 'Drexel Hill',
        principalSubdivision: 'Pennsylvania',
        countryName: 'United States',
        countryCode: 'us',
      }),
      headers: new Headers(),
    } as unknown as Response);

    await expect(reverseGeocodeDeviceLocation(39.9601, -75.2638)).resolves.toEqual({
      name: 'Upper Darby',
      admin1: 'Pennsylvania',
      country: 'United States',
      countryCode: 'US',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=39.9601&longitude=-75.2638&localityLanguage=en',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uses locality when the response does not identify a city', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        latitude: 51.5,
        longitude: -0.12,
        lookupSource: 'coordinates',
        city: '',
        locality: 'Westminster',
        principalSubdivision: 'England',
        countryName: 'United Kingdom',
        countryCode: 'GB',
      }),
      headers: new Headers(),
    } as unknown as Response);

    await expect(reverseGeocodeDeviceLocation(51.5, -0.12)).resolves.toMatchObject({
      name: 'Westminster',
    });
  });

  it('rejects malformed provider data instead of presenting it as live', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ city: 'Upper Darby' }),
      headers: new Headers(),
    } as unknown as Response);

    await expect(reverseGeocodeDeviceLocation(39.9601, -75.2638)).rejects.toBeDefined();
  });
});
