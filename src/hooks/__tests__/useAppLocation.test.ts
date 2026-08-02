import { describe, it, expect } from 'vitest';
import { getDeviceLocationError, validateAndSanitizeLocation } from '../useAppLocation';
import { DEFAULT_LOCATION } from '../../lib/stores/useSettingsStore';

describe('validateAndSanitizeLocation', () => {
  it('returns valid location unchanged', () => {
    const valid = {
      id: 'om-123',
      name: 'Tokyo',
      admin1: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
      source: 'search' as const,
    };

    const sanitized = validateAndSanitizeLocation(valid);
    expect(sanitized).toEqual(valid);
  });

  it('falls back to DEFAULT_LOCATION if coordinates out of bounds', () => {
    const invalidCoords = {
      id: 'invalid-1',
      name: 'Bad Coordinates',
      country: 'Nowhere',
      countryCode: 'NW',
      latitude: 1000, // Invalid latitude (> 90)
      longitude: -75,
      timezone: 'UTC',
      source: 'saved' as const,
    };

    const sanitized = validateAndSanitizeLocation(invalidCoords);
    expect(sanitized).toEqual(DEFAULT_LOCATION);
  });

  it('falls back to DEFAULT_LOCATION if location object is null or missing fields', () => {
    expect(validateAndSanitizeLocation(null)).toEqual(DEFAULT_LOCATION);
    expect(validateAndSanitizeLocation({})).toEqual(DEFAULT_LOCATION);
    expect(validateAndSanitizeLocation('just a string')).toEqual(DEFAULT_LOCATION);
  });
});

describe('getDeviceLocationError', () => {
  it('maps permission denial to a manual-search recovery message', () => {
    expect(getDeviceLocationError({ code: 1 })).toEqual({
      errorType: 'denied',
      errorMessage: 'Location permission denied. You can search for a location manually.',
    });
  });

  it('maps browser timeout distinctly', () => {
    expect(getDeviceLocationError({ code: 3 })).toEqual({
      errorType: 'timeout',
      errorMessage: 'Location request timed out. Please try again or search manually.',
    });
  });
});
