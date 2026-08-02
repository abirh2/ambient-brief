import { describe, it, expect } from 'vitest';
import { interpretAqi } from '../aqiInterpreter';

describe('aqiInterpreter', () => {
  it('handles Good AQI category correctly', () => {
    const interpretation = interpretAqi(42);
    expect(interpretation.category).toBe('Good');
    expect(interpretation.severity).toBe('low');
    expect(interpretation.label).toBe('Good');
    expect(interpretation.guidance).toContain('pollution poses little');
  });

  it('handles Moderate AQI category correctly', () => {
    const interpretation = interpretAqi(75);
    expect(interpretation.category).toBe('Moderate');
    expect(interpretation.severity).toBe('moderate');
    expect(interpretation.label).toBe('Moderate');
  });

  it('handles Unhealthy for Sensitive Groups AQI category correctly', () => {
    const interpretation = interpretAqi(120);
    expect(interpretation.category).toBe('Unhealthy for sensitive groups');
    expect(interpretation.severity).toBe('high');
  });

  it('handles Unhealthy AQI category correctly', () => {
    const interpretation = interpretAqi(175);
    expect(interpretation.category).toBe('Unhealthy');
    expect(interpretation.severity).toBe('severe');
  });

  it('handles Very Unhealthy AQI category correctly', () => {
    const interpretation = interpretAqi(250);
    expect(interpretation.category).toBe('Very unhealthy');
    expect(interpretation.severity).toBe('extreme');
  });

  it('handles Hazardous AQI category correctly', () => {
    const interpretation = interpretAqi(450);
    expect(interpretation.category).toBe('Hazardous');
    expect(interpretation.severity).toBe('extreme');
  });

  it('handles Unknown/null cases safely', () => {
    const interpretationNull = interpretAqi(null);
    expect(interpretationNull.category).toBe('Unknown');
    expect(interpretationNull.severity).toBe('unknown');

    const interpretationNegative = interpretAqi(-10);
    expect(interpretationNegative.category).toBe('Unknown');
  });
});
