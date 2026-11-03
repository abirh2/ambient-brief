import { z } from 'zod';
import { withRequestDeadline } from '../../../lib/api/requestDeadline';
import type { ExchangeRate } from '../model';

const CurrencyListSchema = z.record(z.string(), z.string());
const LatestRateSchema = z.object({
  base: z.string(),
  date: z.iso.date(),
  rates: z.record(z.string(), z.number().finite().positive()),
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
  if (response.base !== base || response.date > fetchedAt.slice(0, 10) || rate === undefined) throw new Error('Currency unavailable');
  return { base, quote, rate, date: response.date, fetchedAt };
}

export async function fetchCurrencyList(signal?: AbortSignal): Promise<Record<string, string>> {
  return withRequestDeadline(async (requestSignal) => {
  const response = await fetch('https://api.frankfurter.dev/v1/currencies', { signal: requestSignal });
  if (!response.ok) throw new Error(`Currency provider returned ${response.status}`);
  return normalizeCurrencyList(await response.json());
  }, signal);
}

export async function fetchLatestRate(base: string, quote: string, signal?: AbortSignal): Promise<ExchangeRate> {
  return withRequestDeadline(async (requestSignal) => {
  const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`, { signal: requestSignal });
  if (!response.ok) throw new Error(response.status === 404 ? 'Currency unavailable' : `Currency provider returned ${response.status}`);
  return normalizeExchangeRate(await response.json(), base, quote);
  }, signal);
}

export function isValidExchangeRate(value: unknown, base: string, quote: string): value is ExchangeRate {
  const parsed = z.object({ base: z.literal(base), quote: z.literal(quote), rate: z.number().finite().positive(), date: z.iso.date(), fetchedAt: z.iso.datetime() }).safeParse(value);
  return parsed.success && Date.parse(parsed.data.fetchedAt) <= Date.now() && parsed.data.date <= parsed.data.fetchedAt.slice(0, 10);
}
