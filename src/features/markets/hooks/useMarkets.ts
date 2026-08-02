import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { fetchMarketInstruments, getUSMarketSessionState, getProviderUsage } from '../alphaVantageService';
import { MarketInstrument, MarketState } from '../../../lib/types';

// Fallback high-quality static list for offline / dev / fallback
const STATIC_INDICES: MarketInstrument[] = [
  {
    symbol: 'SPY',
    displayName: 'S&P 500 proxy · SPY',
    instrumentType: 'etf-proxy',
    proxyFor: 'S&P 500',
    latestPrice: 5432.1,
    changePercent: 0.45,
    priceDate: '2026-07-28',
    fetchedAt: new Date().toISOString(),
    dataStatus: 'end-of-day',
    source: 'Alpha Vantage',
    sparklineData: [
      { time: '9:30', value: 5408 },
      { time: '11:00', value: 5415 },
      { time: '12:30', value: 5410 },
      { time: '14:00', value: 5425 },
      { time: '16:00', value: 5432.1 },
    ],
  },
  {
    symbol: 'DIA',
    displayName: 'Dow proxy · DIA',
    instrumentType: 'etf-proxy',
    proxyFor: 'Dow Jones',
    latestPrice: 40280.5,
    changePercent: 0.32,
    priceDate: '2026-07-28',
    fetchedAt: new Date().toISOString(),
    dataStatus: 'end-of-day',
    source: 'Alpha Vantage',
    sparklineData: [
      { time: '9:30', value: 40150 },
      { time: '11:00', value: 40200 },
      { time: '12:30', value: 40180 },
      { time: '14:00', value: 40250 },
      { time: '16:00', value: 40280.5 },
    ],
  },
  {
    symbol: 'QQQ',
    displayName: 'Nasdaq-100 proxy · QQQ',
    instrumentType: 'etf-proxy',
    proxyFor: 'Nasdaq-100',
    latestPrice: 47890.55,
    changePercent: 0.82,
    priceDate: '2026-07-28',
    fetchedAt: new Date().toISOString(),
    dataStatus: 'end-of-day',
    source: 'Alpha Vantage',
    sparklineData: [
      { time: '9:30', value: 17720 },
      { time: '11:00', value: 17790 },
      { time: '12:30', value: 17810 },
      { time: '14:00', value: 17850 },
      { time: '16:00', value: 17890.55 },
    ],
  },
];

const STATIC_STOCKS: MarketInstrument[] = [
  {
    symbol: 'AAPL',
    displayName: 'Apple Inc.',
    instrumentType: 'company',
    latestPrice: 224.5,
    changePercent: 1.2,
    priceDate: '2026-07-28',
    fetchedAt: new Date().toISOString(),
    dataStatus: 'end-of-day',
    source: 'Alpha Vantage',
    sparklineData: [
      { time: '9:30', value: 221.8 },
      { time: '11:00', value: 222.5 },
      { time: '12:30', value: 223.1 },
      { time: '14:00', value: 223.9 },
      { time: '16:00', value: 224.5 },
    ],
  },
  {
    symbol: 'MSFT',
    displayName: 'Microsoft Corp.',
    instrumentType: 'company',
    latestPrice: 415.6,
    changePercent: -0.3,
    priceDate: '2026-07-28',
    fetchedAt: new Date().toISOString(),
    dataStatus: 'end-of-day',
    source: 'Alpha Vantage',
    sparklineData: [
      { time: '9:30', value: 418.2 },
      { time: '11:00', value: 417.0 },
      { time: '12:30', value: 416.5 },
      { time: '14:00', value: 415.8 },
      { time: '16:00', value: 415.6 },
    ],
  },
];

export function useMarkets() {
  const { settings } = useSettingsStore();
  const { marketStatus: devMarketStatus } = useDevStateStore();

  const [marketState, setMarketState] = useState<MarketState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isDemoMode = import.meta.env.DEV && settings.isDemoMode;

  const loadMarkets = useCallback(
    async (forceRefresh = false) => {
      // 1. Dev State overrides
      if (import.meta.env.DEV && devMarketStatus === 'loading') {
        setMarketState({ status: 'loading' });
        return;
      }
      if (import.meta.env.DEV && devMarketStatus === 'delayed') {
        setMarketState({
          status: 'delayed',
          indices: STATIC_INDICES,
          stocks: STATIC_STOCKS,
          lastUpdatedText: 'Delayed market data · Updated 38 minutes ago',
          note: 'Prices may not reflect current market conditions.',
          sessionStatus: getUSMarketSessionState().statusText,
          usage: getProviderUsage(),
        });
        return;
      }
      if (import.meta.env.DEV && devMarketStatus === 'unavailable') {
        setMarketState({
          status: 'unavailable',
          lastUpdatedText: 'Last updated 12 minutes ago',
          message: 'Market data temporarily unavailable.',
        });
        return;
      }

      // Check API Key
      const apiKey = (settings.alphaVantageApiKey || '').trim();
      if (!apiKey) {
        setMarketState({
          status: 'setup',
          message: 'Alpha Vantage API Key Required',
        });
        return;
      }

      setMarketState({ status: 'loading' });

      try {
        const symbols = settings.marketSymbols && settings.marketSymbols.length > 0
          ? settings.marketSymbols
          : ['SPY', 'DIA', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'];

        const { instruments, usage } = await fetchMarketInstruments(symbols, apiKey, forceRefresh);
        const sessionState = getUSMarketSessionState();

        const indices = instruments.filter(
          (i) => i.instrumentType === 'etf-proxy' || i.category === 'index' || i.category === 'commodity'
        );
        const stocks = instruments.filter(
          (i) => i.instrumentType === 'company' || i.category === 'stock' || i.category === 'crypto'
        );

        setMarketState({
          status: 'loaded',
          indices,
          stocks,
          sessionStatus: sessionState.statusText,
          usage,
        });
      } catch (error: unknown) {
        const usage = getProviderUsage();
        const msg = error instanceof Error ? error.message : 'Failed to fetch market data';
        if (msg.includes('Rate limited') || msg.includes('frequency')) {
          setMarketState({
            status: 'rate_limited',
            message: 'Rate limit detected from Alpha Vantage. Please wait before refreshing.',
            usage,
          });
          return;
        }
        if (msg.includes('quota') || msg.includes('budget')) {
          setMarketState({
            status: 'quota_exhausted',
            message: msg,
            usage,
          });
          return;
        }

        // Fallback to static or cached data if demo mode is enabled, otherwise report unavailable
        if (isDemoMode) {
          setMarketState({
            status: 'delayed',
            indices: STATIC_INDICES,
            stocks: STATIC_STOCKS,
            lastUpdatedText: 'Demo mode data active',
            note: msg,
            sessionStatus: getUSMarketSessionState().statusText,
            usage,
          });
        } else {
          setMarketState({
            status: 'unavailable',
            lastUpdatedText: 'Unavailable',
            message: msg || 'Market data temporarily unavailable.',
          });
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [settings.marketSymbols, settings.alphaVantageApiKey, isDemoMode, devMarketStatus]
  );

  useEffect(() => {
    loadMarkets();
    const controllerRef = abortControllerRef;
    return () => {
      controllerRef.current?.abort();
    };
  }, [loadMarkets]);

  const refreshMarkets = useCallback(() => {
    const usage = getProviderUsage();
    if (usage.requestsAttempted >= 18) {
      const confirmed = window.confirm(
        `Warning: You have used ${usage.requestsAttempted} of 20 advisory daily requests. Proceed with manual refresh?`
      );
      if (!confirmed) return;
    }
    setIsRefreshing(true);
    loadMarkets(true);
  }, [loadMarkets]);

  return {
    marketState,
    isRefreshing,
    refreshMarkets,
  };
}
