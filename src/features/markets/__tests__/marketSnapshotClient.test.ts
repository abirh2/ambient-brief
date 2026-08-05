import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMarketCache, loadMarketSnapshot } from '../marketSnapshotClient';
import { MARKET_INSTRUMENTS } from '../instruments';
import { MarketSnapshotSchema } from '../schemas';

const storage = new Map<string, string>();
const localStorageMock: Storage = {
  get length() { return storage.size; },
  clear: () => storage.clear(),
  getItem: (key) => storage.get(key) ?? null,
  key: (index) => [...storage.keys()][index] ?? null,
  removeItem: (key) => { storage.delete(key); },
  setItem: (key, value) => { storage.set(key, value); },
};

function validSnapshot(generatedAt = '2026-08-05T20:00:00.000Z') {
  return MarketSnapshotSchema.parse({
    schemaVersion: 1, provider: 'finnhub', generatedAt, marketSession: 'regular', freshness: 'fresh', errors: [],
    instruments: MARKET_INSTRUMENTS.map((definition) => ({
      symbol: definition.symbol, name: definition.name, type: definition.type,
      ...(definition.proxyFor ? { proxyFor: definition.proxyFor } : {}),
      price: 100, previousClose: 99, change: 1, changePercent: 1.01,
      providerTimestamp: generatedAt, stale: false,
    })),
  });
}

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', localStorageMock);
});

afterEach(() => {
  clearMarketCache();
  vi.unstubAllGlobals();
});

describe('market snapshot browser client', () => {
  it('validates and caches a public snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(validSnapshot()), { status: 200 })));
    const result = await loadMarketSnapshot();
    expect(result).toMatchObject({ status: 'success', source: 'network', freshness: 'fresh' });
  });

  it('rejects invalid public JSON when no cache exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ provider: 'finnhub' }), { status: 200 })));
    const result = await loadMarketSnapshot();
    expect(result.status).toBe('error');
  });

  it('keeps validated cached data after an explicit refresh failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(validSnapshot()), { status: 200 }))
      .mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    await loadMarketSnapshot();
    const fallback = await loadMarketSnapshot(true);
    expect(fallback).toMatchObject({ status: 'success', source: 'cache', freshness: 'stale' });
  });

  it('adds cache bypass controls for explicit refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(validSnapshot('2026-08-05T20:15:00.000Z')), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await loadMarketSnapshot(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('?refresh=');
    expect(init).toMatchObject({ cache: 'no-store' });
  });
});
