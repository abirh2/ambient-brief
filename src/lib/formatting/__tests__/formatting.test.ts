import { describe, expect, it } from 'vitest';
import { formatClockParts, formatDisplayTime, formatPercent, formatShortTime, formatTemperature } from '..';

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

  it('formats a provider-local time in 12-hour format', () => {
    expect(formatDisplayTime('2026-08-05T18:05', {
      timeFormat: '12h',
      timeZone: 'America/New_York',
      wallTime: true,
    })).toBe('6:05 PM');
  });

  it('formats a provider-local time in 24-hour format', () => {
    expect(formatDisplayTime('2026-08-05T18:05', {
      timeFormat: '24h',
      timeZone: 'America/New_York',
      wallTime: true,
    })).toBe('18:05');
  });

  it('uses the location timezone rather than the browser timezone', () => {
    const instant = new Date('2026-08-05T22:05:00Z');
    expect(formatDisplayTime(instant, { timeFormat: '12h', timeZone: 'America/New_York' })).toBe('6:05 PM');
    expect(formatDisplayTime(instant, { timeFormat: '12h', timeZone: 'Asia/Dhaka' })).toBe('4:05 AM');
  });

  it('honors daylight-saving transitions in the selected timezone', () => {
    expect(formatDisplayTime('2026-03-08T06:30:00Z', { timeFormat: '12h', timeZone: 'America/New_York' })).toBe('1:30 AM');
    expect(formatDisplayTime('2026-03-08T07:30:00Z', { timeFormat: '12h', timeZone: 'America/New_York' })).toBe('3:30 AM');
  });
});
