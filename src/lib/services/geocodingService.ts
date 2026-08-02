import { z } from 'zod';
import { apiFetch } from '../api/apiClient';
import { AppLocation } from '../types';

export const OpenMeteoResultItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  feature_code: z.string().optional(),
  country_code: z.string().optional().default(''),
  country: z.string().optional().default(''),
  admin1: z.string().optional(),
  timezone: z.string().optional().default('UTC'),
});

export const OpenMeteoGeocodingResponseSchema = z.object({
  results: z.array(OpenMeteoResultItemSchema).optional().default([]),
});

export type OpenMeteoResultItem = z.infer<typeof OpenMeteoResultItemSchema>;

export interface SearchLocationsOptions {
  count?: number;
  language?: string;
  signal?: AbortSignal;
}

/**
 * Searches locations using Open-Meteo Geocoding API
 * https://geocoding-api.open-meteo.com/v1/search
 */
export async function searchLocations(
  query: string,
  options: SearchLocationsOptions = {}
): Promise<AppLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const count = options.count ?? 10;
  const language = options.language ?? 'en';
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=${count}&language=${language}&format=json`;

  const response = await apiFetch(url, {
    schema: OpenMeteoGeocodingResponseSchema,
    signal: options.signal,
    retries: 1,
    timeoutMs: 8000,
  });

  if (!response.results || response.results.length === 0) {
    return [];
  }

  return response.results.map((item) => ({
    id: `om-${item.id}`,
    name: item.name,
    admin1: item.admin1,
    country: item.country || '',
    countryCode: item.country_code || '',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || 'UTC',
    source: 'search',
  }));
}

/**
 * Formats a location into a human-readable display string
 * e.g. "Upper Darby, Pennsylvania, United States" or "London, England, United Kingdom"
 */
export function formatLocationLabel(location: AppLocation): string {
  const parts = [
    location.name !== 'Current location' ? location.name : '',
    location.admin1,
    location.country,
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));

  return parts.length > 0 ? parts.join(', ') : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
}

/**
 * Helper to produce a short location string for headers or compact badges
 * e.g. "Upper Darby, PA" or "London, England"
 */
export function formatCompactLocation(location: AppLocation): string {
  const parts = [
    location.name !== 'Current location' ? location.name : '',
    location.admin1 || location.country,
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));
  return parts.length > 0 ? parts.join(', ') : location.name;
}
