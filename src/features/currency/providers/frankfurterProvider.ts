import { z } from 'zod';
import type { ExchangeRate } from '../model';

const CurrencyListSchema = z.record(z.string(), z.string());
const LatestRateSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

export function normalizeCurrencyList(payload: unknown): Record<string, string> {
  return CurrencyListSchema.parse(payload);
}

export function normalizeExchangeRate(
  payload: unknown,
  base: string,
  quote: string,
  fetchedAt = new Date().toISOString(),
): ExchangeRate {
  const response = LatestRateSchema.parse(payload);
  const rate = response.rates[quote];
  if (rate === undefined) throw new Error('Currency unavailable');
  return { base, quote, rate, date: response.date, fetchedAt };
}

export async function fetchCurrencyList(signal?: AbortSignal): Promise<Record<string, string>> {
  const response = await fetch('https://api.frankfurter.dev/v1/currencies', { signal });
  if (!response.ok) throw new Error(`Currency provider returned ${response.status}`);
  return normalizeCurrencyList(await response.json());
}

export async function fetchLatestRate(base: string, quote: string, signal?: AbortSignal): Promise<ExchangeRate> {
  const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=${base}&to=${quote}`, { signal });
  if (!response.ok) throw new Error(response.status === 404 ? 'Currency unavailable' : `Currency provider returned ${response.status}`);
  return normalizeExchangeRate(await response.json(), base, quote);
}
