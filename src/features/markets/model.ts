export type MarketInstrumentType = 'etf-proxy' | 'company';

export type MarketDataFreshness = 'fresh' | 'cached' | 'stale' | 'partial';

export type MarketSession = 'pre-market' | 'regular' | 'after-hours' | 'closed' | 'unknown';

export interface MarketInstrument {
  symbol: string;
  name: string;
  type: MarketInstrumentType;
  proxyFor?: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  providerTimestamp: string | null;
  stale: boolean;
}

export interface MarketSymbolError {
  symbol: string;
  code: 'network' | 'rate-limit' | 'invalid-response' | 'missing-data' | 'provider-error' | 'unknown';
  message: string;
  retainedPreviousValue: boolean;
}

export interface MarketSnapshot {
  schemaVersion: 1;
  provider: 'finnhub';
  generatedAt: string;
  marketSession: MarketSession;
  freshness: MarketDataFreshness;
  instruments: MarketInstrument[];
  errors: MarketSymbolError[];
}

export type MarketState =
  | { status: 'loading' }
  | {
      status: 'loaded' | 'cached' | 'stale' | 'partial';
      snapshot: MarketSnapshot;
      browserFetchedAt: string;
      origin?: 'network' | 'cache';
      notice?: string;
    }
  | { status: 'unavailable'; message: string; notice?: string };

export type MarketStateStatus = MarketState['status'];

const ACTIVE_SESSION_STALE_AFTER_MS = 90 * 60 * 1_000;
const CLOSED_SESSION_STALE_AFTER_MS = 24 * 60 * 60 * 1_000;

export function isSnapshotStale(snapshot: MarketSnapshot, now = Date.now()): boolean {
  const generatedAt = Date.parse(snapshot.generatedAt);
  if (Number.isNaN(generatedAt)) return true;
  const active = snapshot.marketSession === 'pre-market'
    || snapshot.marketSession === 'regular'
    || snapshot.marketSession === 'after-hours';
  return now - generatedAt > (active ? ACTIVE_SESSION_STALE_AFTER_MS : CLOSED_SESSION_STALE_AFTER_MS);
}
