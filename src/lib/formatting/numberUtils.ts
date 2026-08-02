import { TemperatureUnit } from '../types';

export function formatTemperature(fahrenheit: number, unit: TemperatureUnit): string {
  if (unit === 'celsius') {
    const celsius = Math.round(((fahrenheit - 32) * 5) / 9);
    return `${celsius}°C`;
  }
  return `${Math.round(fahrenheit)}°F`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
