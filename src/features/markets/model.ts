export interface MarketTicker {
  symbol: string;
  name: string;
  category: 'index' | 'stock' | 'crypto' | 'commodity';
  price: number;
  changePercent: number;
  sparklineData: Array<{ time: string; value: number }>;
}

export type InstrumentType = 'etf-proxy' | 'company';
export type DataStatus = 'end-of-day' | 'delayed' | 'stale';

export interface MarketInstrument {
  symbol: string;
  displayName: string;
  instrumentType: InstrumentType;
  proxyFor?: string;
  latestPrice: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  priceDate: string;
  fetchedAt: string;
  dataStatus: DataStatus;
  source: 'Alpha Vantage';
  sparklineData?: Array<{ time: string; value: number }>;
  name?: string;
  category?: 'index' | 'stock' | 'crypto' | 'commodity';
  price?: number;
}

export interface ProviderUsage {
  provider: 'alpha-vantage';
  date: string;
  requestsAttempted: number;
  requestsSucceeded: number;
}

export type MarketState =
  | { status: 'loaded'; indices: MarketInstrument[]; stocks: MarketInstrument[]; sessionStatus?: string; usage?: ProviderUsage }
  | { status: 'loading' }
  | { status: 'delayed'; indices: MarketInstrument[]; stocks: MarketInstrument[]; lastUpdatedText: string; note: string; sessionStatus?: string; usage?: ProviderUsage }
  | { status: 'rate_limited'; message: string; usage?: ProviderUsage }
  | { status: 'quota_exhausted'; message: string; usage?: ProviderUsage }
  | { status: 'unavailable'; lastUpdatedText?: string; message?: string }
  | { status: 'setup'; message?: string };

export type MarketStateStatus = MarketState['status'];
