import { describe, it, expect } from 'vitest';
import { generateWeatherInsight } from '../weatherInsight';
import { CurrentWeatherNormalized, HourlyWeatherNormalized } from '../../types/weather';

const baseCurrent: CurrentWeatherNormalized = {
  temperature: 72,
  apparentTemperature: 72,
  humidityPercent: 50,
  windSpeed: 8,
  windGust: 12,
  condition: 'clear',
  conditionLabel: 'Clear Sky',
  weatherCode: 0,
  isDay: true,
  high: 78,
  low: 60,
  sunrise: '06:00 AM',
  sunset: '08:00 PM',
  observedAt: '2026-07-29T16:00:00Z',
  effectVariant: 'clear',
  iconName: 'Sun',
};

describe('weatherInsight', () => {
  it('prioritizes rain alert when precipitation probability is high', () => {
    const hourly: HourlyWeatherNormalized[] = [
      {
        time: '2 PM',
        isoTime: '2026-07-29T14:00',
        temperature: 72,
        apparentTemperature: 72,
        precipitationProbability: 10,
        weatherCode: 0,
        condition: 'clear',
        conditionLabel: 'Clear Sky',
        iconName: 'Sun',
        windSpeed: 5,
      },
      {
        time: '5 PM',
        isoTime: '2026-07-29T17:00',
        temperature: 68,
        apparentTemperature: 68,
        precipitationProbability: 60,
        weatherCode: 61,
        condition: 'rain',
        conditionLabel: 'Slight Rain',
        iconName: 'CloudRain',
        windSpeed: 10,
      },
    ];

    const insight = generateWeatherInsight(baseCurrent, hourly, 'fahrenheit');
    expect(insight).toBe('Rain becomes possible around 5 PM.');
  });

  it('detects significant temperature drop by tonight', () => {
    const current = { ...baseCurrent, temperature: 75 };
    const hourly: HourlyWeatherNormalized[] = [
      {
        time: '4 PM',
        isoTime: '2026-07-29T16:00',
        temperature: 75,
        apparentTemperature: 75,
        precipitationProbability: 0,
        weatherCode: 0,
        condition: 'clear',
        conditionLabel: 'Clear Sky',
        iconName: 'Sun',
        windSpeed: 6,
      },
      {
        time: '9 PM',
        isoTime: '2026-07-29T21:00',
        temperature: 64,
        apparentTemperature: 64,
        precipitationProbability: 0,
        weatherCode: 0,
        condition: 'clear',
        conditionLabel: 'Clear Sky',
        iconName: 'Moon',
        windSpeed: 6,
      },
    ];

    const insight = generateWeatherInsight(current, hourly, 'fahrenheit');
    expect(insight).toBe('Temperatures fall about 11° by tonight.');
  });

  it('detects high wind gusts', () => {
    const current = { ...baseCurrent, windGust: 28, windSpeed: 22 };
    const hourly: HourlyWeatherNormalized[] = [
      {
        time: '3 PM',
        isoTime: '2026-07-29T15:00',
        temperature: 72,
        apparentTemperature: 72,
        precipitationProbability: 0,
        weatherCode: 0,
        condition: 'clear',
        conditionLabel: 'Clear Sky',
        iconName: 'Sun',
        windSpeed: 22,
      },
    ];

    const insight = generateWeatherInsight(current, hourly, 'fahrenheit');
    expect(insight).toBe('Wind gusts may reach 28 mph today.');
  });

  it('detects peak high UV index', () => {
    const current = { ...baseCurrent, windGust: 10, windSpeed: 5 };
    const hourly: HourlyWeatherNormalized[] = [
      {
        time: '1 PM',
        isoTime: '2026-07-29T13:00',
        temperature: 75,
        apparentTemperature: 75,
        precipitationProbability: 0,
        weatherCode: 0,
        condition: 'clear',
        conditionLabel: 'Clear Sky',
        iconName: 'Sun',
        uvIndex: 8,
        windSpeed: 5,
      },
    ];

    const insight = generateWeatherInsight(current, hourly, 'fahrenheit');
    expect(insight).toBe('High UV expected around 1 PM.');
  });

  it('returns clear conditions fallback when no severe events exist', () => {
    const hourly: HourlyWeatherNormalized[] = [
      {
        time: '4 PM',
        isoTime: '2026-07-29T16:00',
        temperature: 72,
        apparentTemperature: 72,
        precipitationProbability: 0,
        weatherCode: 0,
        condition: 'clear',
        conditionLabel: 'Clear Sky',
        iconName: 'Sun',
        windSpeed: 5,
      },
    ];

    const insight = generateWeatherInsight(baseCurrent, hourly, 'fahrenheit');
    expect(insight).toBe('Clear conditions continue through the evening.');
  });
});
