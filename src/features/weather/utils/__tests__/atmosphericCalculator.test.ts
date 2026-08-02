import { describe, it, expect } from 'vitest';
import { deriveTimeOfDay, deriveWeatherEffect, parseTimeToMinutes } from '../atmosphericCalculator';

describe('atmosphericCalculator', () => {
  const sunrise = '2026-07-29T06:00';
  const sunset = '2026-07-29T20:00';

  it('derives Morning correctly', () => {
    const date = new Date('2026-07-29T07:00:00');
    expect(deriveTimeOfDay('UTC', sunrise, sunset, date)).toBe('morning');
  });

  it('derives Day clear correctly', () => {
    const date = new Date('2026-07-29T12:00:00');
    expect(deriveTimeOfDay('UTC', sunrise, sunset, date)).toBe('day');
    expect(deriveWeatherEffect('Clear Sky')).toBe('clear');
  });

  it('derives Day cloudy correctly', () => {
    const date = new Date('2026-07-29T14:00:00');
    expect(deriveTimeOfDay('UTC', sunrise, sunset, date)).toBe('day');
    expect(deriveWeatherEffect('Overcast')).toBe('cloudy');
  });

  it('derives Day rain correctly', () => {
    const date = new Date('2026-07-29T15:00:00');
    expect(deriveTimeOfDay('UTC', sunrise, sunset, date)).toBe('day');
    expect(deriveWeatherEffect('Heavy Rain')).toBe('rain');
  });

  it('derives Night clear correctly', () => {
    const date = new Date('2026-07-29T23:00:00');
    expect(deriveTimeOfDay('UTC', sunrise, sunset, date)).toBe('night');
    expect(deriveWeatherEffect('Clear')).toBe('clear');
  });

  it('derives Sunset storm correctly', () => {
    const date = new Date('2026-07-29T19:30:00');
    expect(deriveTimeOfDay('UTC', sunrise, sunset, date)).toBe('sunset');
    expect(deriveWeatherEffect('Thunderstorm')).toBe('storm');
  });

  it('handles missing weather gracefully', () => {
    expect(deriveWeatherEffect(undefined)).toBe('clear');
    expect(deriveWeatherEffect('')).toBe('clear');
  });

  it('handles missing sunrise/sunset with fallback', () => {
    const date = new Date('2026-07-29T10:00:00');
    expect(deriveTimeOfDay('UTC', undefined, undefined, date)).toBe('day');
  });

  it('handles timezone different from browser timezone', () => {
    const date = new Date('2026-07-29T13:00:00Z');
    const tokyoTimeOfDay = deriveTimeOfDay('Asia/Tokyo', sunrise, sunset, date);
    expect(tokyoTimeOfDay).toBe('night');
  });

  it('parses time strings correctly', () => {
    expect(parseTimeToMinutes('06:04')).toBe(364);
    expect(parseTimeToMinutes('2026-07-29T06:04')).toBe(364);
    expect(parseTimeToMinutes('6:04 AM')).toBe(364);
    expect(parseTimeToMinutes('8:04 PM')).toBe(1204);
    expect(parseTimeToMinutes(undefined)).toBeNull();
  });
});
