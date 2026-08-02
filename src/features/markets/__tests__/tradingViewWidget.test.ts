import { describe, expect, it } from 'vitest';
import { getTradingViewSymbols, TRADINGVIEW_INDEX_SYMBOLS } from '../tradingViewWidget';

describe('TradingView ticker configuration', () => {
  it('uses actual index instruments and all default companies', () => {
    expect(getTradingViewSymbols(['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META']).split(',')).toEqual([
      ...TRADINGVIEW_INDEX_SYMBOLS,
      'NASDAQ:AAPL',
      'NASDAQ:MSFT',
      'NASDAQ:NVDA',
      'NASDAQ:AMZN',
      'NASDAQ:GOOGL',
      'NASDAQ:META',
    ]);
  });

  it('does not pass legacy ETF proxies or unsupported symbols to TradingView', () => {
    expect(getTradingViewSymbols(['SPY', 'DIA', 'QQQ', 'TSLA', 'AAPL'])).toBe(
      [...TRADINGVIEW_INDEX_SYMBOLS, 'NASDAQ:AAPL'].join(','),
    );
  });
});
