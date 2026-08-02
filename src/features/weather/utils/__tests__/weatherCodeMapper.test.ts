import { describe, it, expect } from 'vitest';
import { mapWeatherCode } from '../weatherCodeMapper';

describe('weatherCodeMapper', () => {
  it('maps clear sky code (0) for daytime correctly', () => {
    const result = mapWeatherCode(0, true);
    expect(result.condition).toBe('clear');
    expect(result.label).toBe('Clear Sky');
    expect(result.iconName).toBe('Sun');
    expect(result.effectVariant).toBe('clear');
  });

  it('maps clear sky code (0) for nighttime correctly', () => {
    const result = mapWeatherCode(0, false);
    expect(result.condition).toBe('clear');
    expect(result.iconName).toBe('Moon');
  });

  it('maps partly cloudy code (2)', () => {
    const result = mapWeatherCode(2, true);
    expect(result.condition).toBe('partly-cloudy');
    expect(result.label).toBe('Partly Cloudy');
    expect(result.iconName).toBe('SunCloud');
    expect(result.effectVariant).toBe('cloudy');
  });

  it('maps fog code (45)', () => {
    const result = mapWeatherCode(45, true);
    expect(result.condition).toBe('fog');
    expect(result.label).toBe('Foggy');
    expect(result.effectVariant).toBe('fog');
  });

  it('maps rain code (63)', () => {
    const result = mapWeatherCode(63, true);
    expect(result.condition).toBe('rain');
    expect(result.label).toBe('Moderate Rain');
    expect(result.effectVariant).toBe('rain');
  });

  it('maps snow code (73)', () => {
    const result = mapWeatherCode(73, true);
    expect(result.condition).toBe('snow');
    expect(result.label).toBe('Moderate Snow');
    expect(result.effectVariant).toBe('snow');
  });

  it('maps thunderstorm code (95)', () => {
    const result = mapWeatherCode(95, true);
    expect(result.condition).toBe('thunderstorm');
    expect(result.label).toBe('Thunderstorm');
    expect(result.effectVariant).toBe('storm');
  });

  it('handles unknown/unrecognized weather code gracefully', () => {
    const result = mapWeatherCode(999, true);
    expect(result.condition).toBe('unknown');
    expect(result.label).toBe('Variable');
    expect(result.effectVariant).toBe('clear');
  });
});
