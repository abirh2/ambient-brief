import { describe, expect, it } from 'vitest';
import { normalizeCurrencyList, normalizeExchangeRate } from '../frankfurterProvider';

describe('Frankfurter normalization', () => {
  it('normalizes a rate without leaking provider fields', () => {
    expect(normalizeExchangeRate(
      { amount: 1, base: 'USD', date: '2026-08-01', rates: { BDT: 122.5 } },
      'USD',
      'BDT',
      '2026-08-02T00:00:00.000Z',
    )).toEqual({ base: 'USD', quote: 'BDT', rate: 122.5, date: '2026-08-01', fetchedAt: '2026-08-02T00:00:00.000Z' });
  });

  it('validates currency dictionaries and missing quote rates', () => {
    expect(normalizeCurrencyList({ USD: 'United States Dollar' })).toEqual({ USD: 'United States Dollar' });
    expect(() => normalizeCurrencyList({ USD: 1 })).toThrow();
    expect(() => normalizeExchangeRate({ base: 'USD', date: '2026-08-01', rates: {} }, 'USD', 'BDT')).toThrow('Currency unavailable');
  });

  it('rejects a response for a different base instead of relabeling its rate', () => {
    expect(() => normalizeExchangeRate(
      { base: 'EUR', date: '2026-08-01', rates: { BDT: 122.5 } }, 'USD', 'BDT',
    )).toThrow();
  });

  it.each([0, -1, Infinity, NaN])('rejects a nonpositive or nonfinite rate: %s', (rate) => {
    expect(() => normalizeExchangeRate(
      { base: 'USD', date: '2026-08-01', rates: { EUR: rate } }, 'USD', 'EUR',
    )).toThrow();
  });

  it.each(['not-a-date', '2026-02-30', '2026-13-01', '2026-08-01T00:00:00Z'])('rejects an invalid reference date: %s', (date) => {
    expect(() => normalizeExchangeRate(
      { base: 'USD', date, rates: { EUR: 0.9 } }, 'USD', 'EUR',
    )).toThrow();
  });
});
