import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExchangeRate } from '../../features/currency/model';
import { cacheService } from '../../lib/api/cacheService';
import { fetchCurrencyList, fetchLatestRate } from '../../features/currency/providers/frankfurterProvider';
import { useCurrencyStore } from '../currencyStore';

vi.mock('../../features/currency/providers/frankfurterProvider', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../features/currency/providers/frankfurterProvider')>(),
  fetchLatestRate: vi.fn(),
  fetchCurrencyList: vi.fn(),
}));

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function rate(quote = 'EUR'): ExchangeRate {
  return { base: 'USD', quote, rate: 0.9, date: '2026-08-01', fetchedAt: '2026-08-02T12:00:00.000Z' };
}

describe('currency context acceptance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    vi.stubGlobal('localStorage', storage());
    vi.mocked(fetchLatestRate).mockReset();
    vi.mocked(fetchCurrencyList).mockReset();
    useCurrencyStore.setState({ rate: null, rateLoading: false, rateError: null, isStale: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('removes the old pair while the selected pair is pending', async () => {
    useCurrencyStore.setState({ rate: rate('EUR') });
    const pending = deferred<ExchangeRate>();
    vi.mocked(fetchLatestRate).mockReturnValueOnce(pending.promise);
    const request = useCurrencyStore.getState().fetchExchangeRate('USD', 'GBP');
    const duringRequest = useCurrencyStore.getState().rate;
    pending.resolve(rate('GBP'));
    await request;
    expect(duringRequest).toBeNull();
    expect(useCurrencyStore.getState().rate?.quote).toBe('GBP');
  });

  it('ignores late responses from a previous pair', async () => {
    const old = deferred<ExchangeRate>();
    const current = deferred<ExchangeRate>();
    vi.mocked(fetchLatestRate).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const oldRequest = useCurrencyStore.getState().fetchExchangeRate('USD', 'EUR');
    const currentRequest = useCurrencyStore.getState().fetchExchangeRate('USD', 'GBP');
    current.resolve(rate('GBP'));
    await currentRequest;
    old.resolve(rate('EUR'));
    await oldRequest;
    expect(useCurrencyStore.getState().rate?.quote).toBe('GBP');
  });

  it('does not publish or cache a response resolved after abort', async () => {
    const pending = deferred<ExchangeRate>();
    const controller = new AbortController();
    vi.mocked(fetchLatestRate).mockReturnValueOnce(pending.promise);
    const request = useCurrencyStore.getState().fetchExchangeRate('USD', 'EUR', false, controller.signal);
    const outcome = request.catch(() => false);
    controller.abort();
    pending.resolve(rate());
    await outcome;
    expect(useCurrencyStore.getState().rate).toBeNull();
    expect(cacheService.getCache('exchange_rate_v1_USD_EUR')).toBeNull();
    expect(useCurrencyStore.getState().rateLoading).toBe(false);
  });

  it('ignores an old pair failure while the new pair is loading', async () => {
    const old = deferred<ExchangeRate>();
    const current = deferred<ExchangeRate>();
    vi.mocked(fetchLatestRate).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const oldRequest = useCurrencyStore.getState().fetchExchangeRate('USD', 'EUR');
    const currentRequest = useCurrencyStore.getState().fetchExchangeRate('USD', 'GBP');
    old.reject(new Error('Old request failed'));
    await oldRequest;
    const whileCurrentPending = useCurrencyStore.getState();
    current.resolve(rate('GBP'));
    await currentRequest;
    expect(whileCurrentPending.rateLoading).toBe(true);
    expect(whileCurrentPending.rateError).toBeNull();
  });

  it('revalidates a cached rate after its twelve-hour TTL elapses', async () => {
    cacheService.setCache('exchange_rate_v1_USD_EUR', rate(), 12 * 60 * 60 * 1000);
    expect(await useCurrencyStore.getState().fetchExchangeRate('USD', 'EUR')).toBe('cached');
    expect(fetchLatestRate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);
    vi.mocked(fetchLatestRate).mockResolvedValueOnce({ ...rate(), rate: 0.95 });
    expect(await useCurrencyStore.getState().fetchExchangeRate('USD', 'EUR')).toBe('success');
    expect(fetchLatestRate).toHaveBeenCalledOnce();
    expect(useCurrencyStore.getState().rate?.rate).toBe(0.95);
  });

  it('rejects corrupt currency names instead of trusting cached record values', async () => {
    cacheService.setCache('currency_list_v1', { USD: 42 }, 60_000);
    vi.mocked(fetchCurrencyList).mockRejectedValueOnce(new Error('Offline'));
    expect(await useCurrencyStore.getState().fetchCurrencies()).toEqual({});
    expect(useCurrencyStore.getState().currenciesError).toBe('Currency list unavailable');
  });

  it('reports elapsed TTL to routine scans without needing a previous failure', () => {
    cacheService.setCache('exchange_rate_v1_USD_EUR', rate(), 12 * 60 * 60 * 1000);
    expect(useCurrencyStore.getState().isRateStale('USD', 'EUR')).toBe(false);
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);
    expect(useCurrencyStore.getState().isRateStale('USD', 'EUR')).toBe(true);
  });

  it('rejects a cache payload whose pair does not match its key', async () => {
    cacheService.setCache('exchange_rate_v1_USD_GBP', rate('EUR'), 12 * 60 * 60 * 1000);
    vi.mocked(fetchLatestRate).mockRejectedValueOnce(new Error('Offline'));
    await useCurrencyStore.getState().fetchExchangeRate('USD', 'GBP');
    expect(useCurrencyStore.getState().rate).toBeNull();
    expect(useCurrencyStore.getState().rateError).toBeTruthy();
  });

  it('retains a valid same-pair fallback without advancing its successful timestamp', async () => {
    cacheService.setCache('exchange_rate_v1_USD_EUR', rate(), 12 * 60 * 60 * 1000);
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);
    vi.mocked(fetchLatestRate).mockRejectedValueOnce(new Error('Offline'));
    expect(await useCurrencyStore.getState().fetchExchangeRate('USD', 'EUR')).toBe('cached');
    expect(useCurrencyStore.getState().rate).toEqual(rate());
    expect(useCurrencyStore.getState().isStale).toBe(true);
    expect(cacheService.getCache<ExchangeRate>('exchange_rate_v1_USD_EUR')?.fetchedAt).toBe('2026-08-02T12:00:00.000Z');
  });
});
