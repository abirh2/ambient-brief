import { describe, it, expect } from 'vitest';
import { isActiveNWSAlert } from '../../providers/nwsAlertsProvider';
import { MOCK_WEATHER_ALERTS } from '../../../../mocks/ambientData';

it('rejects an alert with an unparseable expiration rather than keeping it active indefinitely', () => {
  expect(isActiveNWSAlert({ ...MOCK_WEATHER_ALERTS.warning, expires: 'corrupt', ends: undefined })).toBe(false);
});

describe('active alert boundary', () => {
  it('expires exactly at the earliest ends/expires instant', () => {
    expect(isActiveNWSAlert({ ...MOCK_WEATHER_ALERTS.warning, ends: '2026-08-01T12:00:00Z', expires: '2026-08-01T13:00:00Z' }, Date.parse('2026-08-01T12:00:00Z'))).toBe(false);
  });
});
