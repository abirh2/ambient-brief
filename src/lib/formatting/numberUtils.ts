import { TemperatureUnit } from '../types';

export function formatTemperature(value: number, unit: TemperatureUnit, showUnit = true): string {
  const suffix = showUnit ? (unit === 'celsius' ? 'C' : 'F') : '';
  return `${Math.round(value)}°${suffix}`;
}

export function formatPercent(value: number, options: { signed?: boolean; digits?: number } = {}): string {
  const { signed = true, digits = 2 } = options;
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
