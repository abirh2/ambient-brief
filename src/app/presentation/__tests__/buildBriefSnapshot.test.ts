import { describe, it, expect } from 'vitest';
import { buildBriefSnapshot, presentValue } from '../buildBriefSnapshot';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { useIslamicStore } from '../../../stores/prayerTimesStore';
import { makeTestFeed } from '../../../features/news/__tests__/generatedFeedSchemas.test';
import { GeneratedNewsFeedSchema } from '../../../features/news/generatedFeedSchemas';
import { stateFromFeed } from '../../../features/news/hooks/useNews';

const success = async () => 'success' as const;
function input(): Parameters<typeof buildBriefSnapshot>[0] {
  return {
    settings: useSettingsStore.getState().settings,
    weather: { weatherState: { status: 'loading' }, metadata: null, isRefreshing: false, loadWeather: success, refreshWeather: success, isWeatherStale: () => true },
    airQuality: { aqiState: { status: 'loading' }, metadata: null, isRefreshing: false, loadAirQuality: success, refreshAirQuality: success, isAirQualityStale: () => true },
    nws: { alerts: [], coverage: 'none', metadata: null, dismissAlert: () => {}, refreshAlerts: success, isAlertsStale: () => false },
    news: { newsState: { status: 'empty' }, feedMetadata: null, isRefreshing: false, loadNews: success, refreshNews: success, isNewsStale: () => false },
    currency: useCurrencyStore.getState(), islamic: useIslamicStore.getState(), marketState: { status: 'loading' },
  };
}
describe('truthful presentation projection', () => {
  it('never turns unavailable or fresh cache into live observation', () => {
    const metadata = { lastCheck: null, refreshing: false, contextKey: 'a', availability: 'unavailable' as const, source: 'test', sourceTime: { kind: 'unknown' as const }, successfulFetchAt: null, origin: 'cache' as const, partial: false, qualifiers: [], freshness: 'cached' as const };
    expect(presentValue(null, metadata).freshness).toBe('unavailable');
    expect(presentValue(42, { ...metadata, availability: 'available' }).freshness).toBe('cached');
  });
  it('distinguishes confirmed empty alerts from unsupported coverage', () => {
    const data = input();
    expect(buildBriefSnapshot(data).alerts).toMatchObject({ value: [], availability: 'empty' });
    data.nws.coverage = 'unsupported';
    expect(buildBriefSnapshot(data).alerts).toMatchObject({ value: null, availability: 'unsupported', freshness: 'unavailable' });
  });
  it('preserves original feed generation time and ages downloaded news without inventing category age', () => {
    const data = input();
    const feed = GeneratedNewsFeedSchema.parse(makeTestFeed());
    data.news.newsState = stateFromFeed(feed, ['Top'], 'static');
    data.news.feedMetadata = { contextKey: 'Top', origin: 'network', successfulFetchAt: '2026-08-02T12:00:00Z', generatedAt: feed.generatedAt, partial: true };
    const snapshot = buildBriefSnapshot(data, Date.parse(feed.generatedAt) + 76 * 60_000);
    expect(snapshot.news).toMatchObject({ freshness: 'stale', partial: true, sourceTime: { kind: 'instant', iso: feed.generatedAt }, successfulFetchAt: '2026-08-02T12:00:00Z' });
    expect(snapshot.news.qualifiers.join(' ')).toContain('age unknown');
  });
  it('withholds expired mounted currency while preserving the reference date within retention', () => {
    const data = input();
    data.settings = { ...data.settings, currencyEnabled: true, currencyPair: 'USD/EUR' };
    data.currency = { ...data.currency, rateOrigin: 'cache', rate: { base: 'USD', quote: 'EUR', rate: 0.9, date: '2026-08-02', fetchedAt: '2026-08-02T12:00:00Z' } };
    expect(buildBriefSnapshot(data, Date.parse('2026-08-03T00:00:00Z')).currency.sourceTime).toEqual({ kind: 'date', value: '2026-08-02' });
    expect(buildBriefSnapshot(data, Date.parse('2026-08-04T12:00:00Z')).currency).toMatchObject({ value: null, freshness: 'unavailable' });
  });

  it('keeps old partial market rows stale as the presentation clock advances', () => {
    const data = input();
    data.marketState = { status: 'partial', origin: 'network', browserFetchedAt: '2026-08-02T12:00:00Z', snapshot: { schemaVersion: 1, provider: 'finnhub', generatedAt: '2026-08-02T12:00:00Z', marketSession: 'regular', freshness: 'partial', errors: [], instruments: [{ symbol: 'SPY', name: 'ETF proxy', type: 'etf-proxy', price: 100, previousClose: null, change: null, changePercent: null, providerTimestamp: null, stale: false }] } };
    expect(buildBriefSnapshot(data, Date.parse('2026-08-02T12:00:00Z')).markets[0]).toMatchObject({ freshness: 'delayed', sourceTime: { kind: 'unknown' } });
    expect(buildBriefSnapshot(data, Date.parse('2026-08-02T14:00:00Z')).markets[0]).toMatchObject({ freshness: 'stale', partial: true });
  });
});
