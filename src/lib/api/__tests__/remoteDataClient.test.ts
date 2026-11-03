import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheService } from '../cacheService';
import { loadRemoteData } from '../remoteDataClient';

const policy = { freshForMs: 1_000, staleForMs: 1_000 };

const createLocalStorageMock = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => Object.keys(store)[index] ?? null,
  };
};

describe('remote data client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    vi.stubGlobal('localStorage', createLocalStorageMock());
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('returns stale cache immediately and revalidates in the background', async () => {
    cacheService.setCache('weather-swr', { temperature: 70 }, policy);
    vi.advanceTimersByTime(1_001);
    const fetcher = vi.fn().mockResolvedValue({ temperature: 72 });
    const onRevalidated = vi.fn();

    const result = await loadRemoteData({
      cacheKey: 'weather-swr',
      cachePolicy: policy,
      fetcher,
      onRevalidated,
    });

    expect(result).toMatchObject({
      status: 'success',
      source: 'cache',
      freshness: 'stale',
      data: { temperature: 70 },
    });
    await vi.waitFor(() => expect(onRevalidated).toHaveBeenCalledWith(expect.objectContaining({ source: 'network' })));
  });

  it('uses expired cache as an offline fallback', async () => {
    cacheService.setCache('weather-offline', { temperature: 70 }, policy);
    vi.advanceTimersByTime(2_001);
    vi.stubGlobal('navigator', { onLine: false });
    const fetcher = vi.fn();

    const result = await loadRemoteData({
      cacheKey: 'weather-offline',
      cachePolicy: policy,
      fetcher,
    });

    expect(result).toMatchObject({ status: 'success', source: 'cache', freshness: 'stale' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent requests for the same cache key', async () => {
    let resolveRequest: ((value: { temperature: number }) => void) | undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<{ temperature: number }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const options = { cacheKey: 'weather-dedupe', cachePolicy: policy, fetcher };

    const first = loadRemoteData(options);
    const second = loadRemoteData(options);
    expect(fetcher).toHaveBeenCalledOnce();
    resolveRequest?.({ temperature: 72 });

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toMatchObject({ status: 'success', source: 'network' });
    expect(secondResult).toEqual(firstResult);
  });

  it('does not turn cancellation into a cached success', async () => {
    cacheService.setCache('cancelled-fallback', { temperature: 70 }, policy);
    const controller = new AbortController();
    const request = loadRemoteData({
      cacheKey: 'cancelled-fallback',
      cachePolicy: policy,
      forceRefresh: true,
      signal: controller.signal,
      fetcher: () => new Promise<{ temperature: number }>(() => undefined),
    });

    controller.abort();

    await expect(request).resolves.toMatchObject({ status: 'error', error: { code: 'aborted' } });
    expect(cacheService.getCache<{ temperature: number }>('cancelled-fallback')?.data.temperature).toBe(70);
  });

  it('does not cache a late response after its consumer is aborted', async () => {
    const controller = new AbortController();
    let complete: ((value: { temperature: number }) => void) | undefined;
    const request = loadRemoteData({
      cacheKey: 'cancelled-late-result',
      cachePolicy: policy,
      forceRefresh: true,
      signal: controller.signal,
      fetcher: () => new Promise<{ temperature: number }>((resolve) => { complete = resolve; }),
    });

    controller.abort();
    complete?.({ temperature: 99 });

    await expect(request).resolves.toMatchObject({ status: 'error', error: { code: 'aborted' } });
    expect(cacheService.getCache('cancelled-late-result')).toBeNull();
  });

  it('starts a new request instead of reusing a cancelled in-flight request', async () => {
    const controller = new AbortController();
    let completeFirst: ((value: { temperature: number }) => void) | undefined;
    const fetcher = vi.fn()
      .mockImplementationOnce(() => new Promise<{ temperature: number }>((resolve) => { completeFirst = resolve; }))
      .mockResolvedValueOnce({ temperature: 75 });
    const options = { cacheKey: 'cancelled-then-restarted', cachePolicy: policy, forceRefresh: true, fetcher };
    const first = loadRemoteData({ ...options, signal: controller.signal });
    controller.abort();
    await first;
    const second = loadRemoteData(options);
    completeFirst?.({ temperature: 99 });

    await expect(second).resolves.toMatchObject({ status: 'success', data: { temperature: 75 } });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
