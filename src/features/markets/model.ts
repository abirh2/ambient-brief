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
      notice?: string;
    }
  | { status: 'unavailable'; message: string; notice?: string };

export type MarketStateStatus = MarketState['status'];
