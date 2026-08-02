export interface CurrencyPair { base: string; quote: string }

export interface ExchangeRate {
  base: string;
  quote: string;
  rate: number;
  date: string;
  fetchedAt: string;
}

export interface CurrencyRate {
  pair: string;
  rate: number;
  change24h: number;
}
