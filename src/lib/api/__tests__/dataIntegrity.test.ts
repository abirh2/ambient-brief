import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { cacheService } from '../cacheService';
import { readContextCache } from '../contextCache';
import { fetchNWSAlerts } from '../../../features/weather/providers/nwsAlertsProvider';
import { fetchCurrencyList, fetchLatestRate } from '../../../features/currency/providers/frankfurterProvider';
import { StaticNewsProvider } from '../../../features/news/providers/staticNewsProvider';
import { fetchScheduleForDate } from '../../../features/prayer-times/service';

function storage(): Storage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); }, clear: () => values.clear(), key: (index) => [...values.keys()][index] ?? null, get length() { return values.size; } };
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-08-05T12:00:00Z')); vi.stubGlobal('localStorage', storage()); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('verified context cache retention', () => {
  it('rejects rounded-coordinate collisions and corrupt payloads', () => {
    cacheService.setCache('weather-rounded', { contextKey: 'exact-location-A', value: 42 }, 60_000);
    expect(readContextCache('weather-rounded', 'exact-location-B', z.number())).toBeNull();
    cacheService.setCache('weather-rounded', { contextKey: 'exact-location-B', value: 'bad' }, 60_000);
    expect(readContextCache('weather-rounded', 'exact-location-B', z.number())).toBeNull();
  });
  it('retains matching data and its original successful-fetch time, then rejects expired data', () => {
    cacheService.setCache('data', { contextKey: 'A', value: 42 }, { freshForMs: 1_000, staleForMs: 1_000 });
    const original = readContextCache('data', 'A', z.number());
    vi.advanceTimersByTime(1_001);
    expect(readContextCache('data', 'A', z.number())).toEqual({ ...original, isStale: true });
    vi.advanceTimersByTime(1_000);
    expect(readContextCache('data', 'A', z.number())).toBeNull();
  });
  it('rejects future successful-fetch timestamps', () => {
    cacheService.setCache('data', { contextKey: 'A', value: 42 }, 60_000);
    vi.setSystemTime(new Date('2026-08-04T12:00:00Z'));
    expect(readContextCache('data', 'A', z.number())).toBeNull();
  });
});
describe('direct provider body deadlines', () => {
  it.each([
    ['NWS', () => fetchNWSAlerts(40, -75)],
    ['currency list', () => fetchCurrencyList()],
    ['currency rate', () => fetchLatestRate('USD', 'EUR')],
    ['static news', () => new StaticNewsProvider().fetchHeadlines(['Top'])],
    ['prayer day', () => fetchScheduleForDate(40, -75, '05-08-2026', 'ISNA', 'Hanafi')],
  ] as const)('bounds %s even when the response body ignores abort', async (_name, load) => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => new Promise(() => {}) });
    vi.stubGlobal('fetch', fetcher);
    const outcome = load().catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await outcome).toMatchObject({ code: 'timeout' });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[1].signal.aborted).toBe(true);
  });
});
