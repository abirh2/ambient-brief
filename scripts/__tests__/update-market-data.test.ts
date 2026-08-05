import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { MARKET_INSTRUMENTS } from '../../src/features/markets/instruments.ts';
import type { MarketSnapshot } from '../../src/features/markets/model.ts';
import { MarketSnapshotSchema } from '../../src/features/markets/schemas.ts';
import {
  estimateMarketSession,
  generateMarketSnapshot,
  MarketUpdateError,
  readPreviousMarketSnapshot,
} from '../update-market-data.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function outputPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'ambient-market-test-'));
  temporaryDirectories.push(directory);
  return join(directory, 'markets.json');
}

function quote(overrides: Record<string, unknown> = {}) {
  return { c: 200, d: 2, dp: 1, h: 203, l: 197, o: 198, pc: 198, t: 1_786_000_000, ...overrides };
}

function fetchFor(
  responseForSymbol: (symbol: string) => Response | Promise<Response>,
  observedUrls: string[] = [],
): typeof fetch {
  return async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    observedUrls.push(url);
    expect(new URL(url).searchParams.has('token')).toBe(false);
    expect(new Headers(init?.headers).get('X-Finnhub-Token')).toBeTruthy();
    return responseForSymbol(new URL(url).searchParams.get('symbol') ?? '');
  };
}

function snapshot(generatedAt = '2026-08-05T20:00:00.000Z'): MarketSnapshot {
  return MarketSnapshotSchema.parse({
    schemaVersion: 1,
    provider: 'finnhub',
    generatedAt,
    marketSession: 'regular',
    freshness: 'fresh',
    instruments: MARKET_INSTRUMENTS.map((definition) => ({
      symbol: definition.symbol,
      name: definition.name,
      type: definition.type,
      ...(definition.proxyFor ? { proxyFor: definition.proxyFor } : {}),
      price: 100,
      previousClose: 99,
      change: 1,
      changePercent: 1.01,
      providerTimestamp: generatedAt,
      stale: false,
    })),
    errors: [],
  });
}

describe('market snapshot generator', () => {
  it('requires FINNHUB_API_KEY without writing output', async () => {
    const path = await outputPath();
    await expect(generateMarketSnapshot({ apiKey: '', outputPath: path })).rejects.toThrow('FINNHUB_API_KEY is required');
    await expect(readFile(path, 'utf8')).rejects.toThrow();
  });

  it('normalizes and validates every successful quote', async () => {
    const path = await outputPath();
    const result = await generateMarketSnapshot({
      apiKey: 'test-secret', outputPath: path, batchDelayMs: 0,
      now: new Date('2026-08-05T15:00:00.000Z'),
      fetchImpl: fetchFor(() => new Response(JSON.stringify(quote()), { status: 200 })),
    });
    expect(result.status).toBe('updated');
    if (result.status !== 'updated') return;
    expect(result.snapshot.instruments).toHaveLength(9);
    expect(result.snapshot.instruments[0]).toMatchObject({ symbol: 'SPY', proxyFor: 'S&P 500', price: 200 });
    expect(MarketSnapshotSchema.parse(JSON.parse(await readFile(path, 'utf8')))).toEqual(result.snapshot);
  });

  it.each([
    ['invalid JSON', () => new Response('<html>bad gateway</html>', { status: 200 }), 'invalid-response'],
    ['HTTP error', () => new Response('', { status: 503 }), 'provider-error'],
    ['HTTP 200 provider error', () => new Response(JSON.stringify({ error: 'Invalid API key' }), { status: 200 }), 'provider-error'],
    ['empty quote', () => new Response('{}', { status: 200 }), 'missing-data'],
    ['zero price', () => new Response(JSON.stringify(quote({ c: 0 })), { status: 200 }), 'missing-data'],
    ['rate limit', () => new Response('', { status: 429 }), 'rate-limit'],
  ])('categorizes %s without exposing provider content', async (_label, responseFactory, expectedCode) => {
    const path = await outputPath();
    const secret = 'do-not-log-this-secret';
    const promise = generateMarketSnapshot({
      apiKey: secret, outputPath: path, batchDelayMs: 0,
      fetchImpl: fetchFor(() => responseFactory()),
    });
    await expect(promise).rejects.toBeInstanceOf(MarketUpdateError);
    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(MarketUpdateError);
      if (error instanceof MarketUpdateError) {
        expect(error.diagnostics.every((item) => item.code === expectedCode)).toBe(true);
        expect(JSON.stringify(error.diagnostics)).not.toContain(secret);
      }
    }
  });

  it('publishes partial success and retains a previous valid failed symbol', async () => {
    const path = await outputPath();
    await writeFile(path, `${JSON.stringify(snapshot())}\n`);
    const result = await generateMarketSnapshot({
      apiKey: 'secret', outputPath: path, batchDelayMs: 0,
      now: new Date('2026-08-05T21:00:00.000Z'),
      fetchImpl: fetchFor((symbol) => symbol === 'NVDA'
        ? new Response('', { status: 429 })
        : new Response(JSON.stringify(quote()), { status: 200 })),
    });
    expect(result.status).toBe('updated');
    if (result.status !== 'updated') return;
    expect(result.snapshot.freshness).toBe('partial');
    expect(result.snapshot.instruments.find((item) => item.symbol === 'NVDA')).toMatchObject({ price: 100, stale: true });
    expect(result.snapshot.errors).toContainEqual(expect.objectContaining({ symbol: 'NVDA', code: 'rate-limit', retainedPreviousValue: true }));
  });

  it('publishes only valid symbols on a first partial run', async () => {
    const path = await outputPath();
    const result = await generateMarketSnapshot({
      apiKey: 'secret', outputPath: path, batchDelayMs: 0,
      fetchImpl: fetchFor((symbol) => ['NVDA', 'META'].includes(symbol)
        ? new Response('{}', { status: 200 })
        : new Response(JSON.stringify(quote()), { status: 200 })),
    });
    expect(result.status).toBe('updated');
    if (result.status === 'updated') {
      expect(result.snapshot.instruments).toHaveLength(7);
      expect(result.snapshot.errors).toHaveLength(2);
    }
  });

  it('preserves the old file when every symbol fails', async () => {
    const path = await outputPath();
    const previous = `${JSON.stringify(snapshot())}\n`;
    await writeFile(path, previous);
    await expect(generateMarketSnapshot({
      apiKey: 'secret', outputPath: path, batchDelayMs: 0,
      fetchImpl: fetchFor(() => new Response('', { status: 503 })),
    })).rejects.toBeInstanceOf(MarketUpdateError);
    expect(await readFile(path, 'utf8')).toBe(previous);
  });

  it('does not trust an invalid previous snapshot', async () => {
    const path = await outputPath();
    await writeFile(path, JSON.stringify({ provider: 'finnhub', instruments: [{ symbol: 'NVDA', price: 999 }] }));
    expect(await readPreviousMarketSnapshot(path)).toBeUndefined();
    const result = await generateMarketSnapshot({
      apiKey: 'secret', outputPath: path, batchDelayMs: 0,
      fetchImpl: fetchFor((symbol) => symbol === 'NVDA'
        ? new Response('{}', { status: 200 })
        : new Response(JSON.stringify(quote()), { status: 200 })),
    });
    expect(result.status === 'updated' && result.snapshot.instruments.some((item) => item.symbol === 'NVDA')).toBe(false);
  });
});

describe('Eastern market-session estimate', () => {
  it('covers pre-market, regular, after-hours, and closed windows', () => {
    expect(estimateMarketSession(new Date('2026-08-05T12:00:00.000Z'))).toBe('pre-market');
    expect(estimateMarketSession(new Date('2026-08-05T15:00:00.000Z'))).toBe('regular');
    expect(estimateMarketSession(new Date('2026-08-05T21:00:00.000Z'))).toBe('after-hours');
    expect(estimateMarketSession(new Date('2026-08-08T15:00:00.000Z'))).toBe('closed');
  });
});
