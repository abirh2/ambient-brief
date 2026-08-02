import { MarketTicker } from '../../lib/types';
import { fetchMarketInstruments, ETF_PROXIES, DEFAULT_COMPANIES } from './alphaVantageService';

export async function fetchMarketTickers(
  symbols: string[],
  userApiKey?: string,
  forceRefresh = false
): Promise<MarketTicker[]> {
  const targetSymbols = symbols && symbols.length > 0 ? symbols : ['SPY', 'DIA', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'];
  try {
    const { instruments } = await fetchMarketInstruments(targetSymbols, userApiKey, forceRefresh);
    return instruments.map((inst) => ({
      symbol: inst.symbol,
      name: inst.displayName,
      category: inst.instrumentType === 'etf-proxy' ? 'index' : 'stock',
      price: inst.latestPrice,
      changePercent: inst.changePercent || 0,
      sparklineData: inst.sparklineData || [],
    }));
  } catch (err) {
    throw err;
  }
}
