import { describe, expect, it } from 'vitest';
import {
  buildNWSAlertsUrl,
  isActiveNWSAlert,
  NwsAlertsResponseSchema,
  normalizeNWSAlert,
  sortNWSAlerts,
} from '../nwsAlertsProvider';
import type { WeatherAlert } from '../../../../lib/types';

function makeAlert(overrides: Partial<WeatherAlert> = {}): WeatherAlert {
  return {
    id: 'https://api.weather.gov/alerts/one',
    event: 'Storm Warning',
    headline: 'Storm Warning issued',
    description: 'Take shelter.',
    severity: 'moderate',
    certainty: 'Likely',
    urgency: 'Expected',
    status: 'Actual',
    messageType: 'Alert',
    areaDescription: 'Example County',
    source: 'National Weather Service',
    ...overrides,
  };
}

describe('NWS alerts provider', () => {
  it('validates GeoJSON and preserves the NWS feature ID for dismissal', () => {
    const response = NwsAlertsResponseSchema.parse({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        id: 'https://api.weather.gov/alerts/abc',
        properties: { event: 'Flood Warning', severity: 'Severe', urgency: 'Immediate' },
      }],
    });

    expect(normalizeNWSAlert(response.features[0])).toMatchObject({
      id: 'https://api.weather.gov/alerts/abc', severity: 'severe', urgency: 'Immediate',
    });
  });

  it('rejects malformed GeoJSON features without a unique ID', () => {
    expect(() => NwsAlertsResponseSchema.parse({ type: 'FeatureCollection', features: [{ properties: {} }] })).toThrow();
  });

  it('excludes expired, cancelled, and test alerts', () => {
    const now = Date.parse('2026-08-02T12:00:00Z');
    expect(isActiveNWSAlert(makeAlert({ expires: '2026-08-02T11:59:59Z' }), now)).toBe(false);
    expect(isActiveNWSAlert(makeAlert({ messageType: 'Cancel' }), now)).toBe(false);
    expect(isActiveNWSAlert(makeAlert({ status: 'Test' }), now)).toBe(false);
    expect(isActiveNWSAlert(makeAlert({ expires: '2026-08-02T12:00:01Z' }), now)).toBe(true);
  });

  it('orders alerts by severity, then urgency, then expiration', () => {
    const alerts = sortNWSAlerts([
      makeAlert({ id: 'moderate-immediate', urgency: 'Immediate' }),
      makeAlert({ id: 'severe-future', severity: 'severe', urgency: 'Future' }),
      makeAlert({ id: 'moderate-expected', urgency: 'Expected' }),
    ]);
    expect(alerts.map((alert) => alert.id)).toEqual(['severe-future', 'moderate-immediate', 'moderate-expected']);
  });

  it('uses the official point endpoint with normalized precision', () => {
    expect(buildNWSAlertsUrl(40.712776, -74.005974)).toBe(
      'https://api.weather.gov/alerts/active?point=40.7128,-74.0060',
    );
  });
});
