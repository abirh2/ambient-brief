import type { MarketInstrumentType } from './model';

export interface MarketInstrumentDefinition {
  symbol: string;
  name: string;
  type: MarketInstrumentType;
  proxyFor?: string;
}

export const MARKET_INSTRUMENTS: readonly MarketInstrumentDefinition[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF Proxy', type: 'etf-proxy', proxyFor: 'S&P 500' },
  { symbol: 'DIA', name: 'Dow Jones ETF Proxy', type: 'etf-proxy', proxyFor: 'Dow Jones' },
  { symbol: 'QQQ', name: 'Nasdaq-100 ETF Proxy', type: 'etf-proxy', proxyFor: 'Nasdaq-100' },
  { symbol: 'AAPL', name: 'Apple', type: 'company' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'company' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'company' },
  { symbol: 'AMZN', name: 'Amazon', type: 'company' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'company' },
  { symbol: 'META', name: 'Meta', type: 'company' },
] as const;

export const MARKET_COMPANIES = MARKET_INSTRUMENTS.filter((instrument) => instrument.type === 'company');
export const MARKET_PROXY_SYMBOLS = ['SPY', 'DIA', 'QQQ'] as const;
