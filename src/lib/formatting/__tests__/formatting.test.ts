import { describe, expect, it } from 'vitest';
import { formatClockParts, formatPercent, formatShortTime, formatTemperature } from '..';

describe('application formatting', () => {
  it('formats normalized temperatures without converting them again', () => {
    expect(formatTemperature(21.4, 'celsius')).toBe('21°C');
    expect(formatTemperature(70.6, 'fahrenheit', false)).toBe('71°');
  });

  it('formats percentages consistently', () => {
    expect(formatPercent(1.234)).toBe('+1.23%');
    expect(formatPercent(42, { signed: false, digits: 0 })).toBe('42%');
  });

  it('returns stable clock parts for either time preference', () => {
    const date = new Date('2026-08-02T17:04:09Z');
    expect(formatClockParts(date, '24h').minutes).toBe('04');
    expect(formatShortTime('invalid', '12h')).toBe('Unknown time');
  });
});
