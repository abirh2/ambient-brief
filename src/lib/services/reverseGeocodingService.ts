import { z } from 'zod';
import { apiFetch } from '../api/apiClient';

const NullableLocationPartSchema = z
  .string()
  .nullish()
  .transform((value) => value?.trim() ?? '');

export const BigDataCloudReverseGeocodingResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  lookupSource: z.string(),
  city: NullableLocationPartSchema,
  locality: NullableLocationPartSchema,
  principalSubdivision: NullableLocationPartSchema,
  countryName: NullableLocationPartSchema,
  countryCode: NullableLocationPartSchema,
});

export interface ReverseGeocodedLocation {
  name: string;
  admin1?: string;
  country: string;
  countryCode: string;
}

/**
 * Resolves coordinates obtained directly from browser geolocation to a locality.
 * BigDataCloud's free endpoint permits client-side requests for the device's
 * current, user-consented coordinates only. Do not use this for saved locations.
 */
export async function reverseGeocodeDeviceLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodedLocation> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    localityLanguage: 'en',
  });
  const response = await apiFetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
    {
      schema: BigDataCloudReverseGeocodingResponseSchema,
      signal,
      retries: 0,
      timeoutMs: 6_000,
      providerId: 'reverseGeocoding',
    },
  );

  const name = response.city || response.locality;
  if (!name) {
    throw new Error('The reverse-geocoding response did not include a city or locality.');
  }

  return {
    name,
    admin1: response.principalSubdivision || undefined,
    country: response.countryName,
    countryCode: response.countryCode.toUpperCase(),
  };
}
