import { isSnapshotStale } from '../../features/markets/model';
import { isGeneratedFeedStale } from '../../features/news/model';
import type { DataFreshness } from '../../types/remote';
import type { useWeather } from '../../features/weather/hooks/useWeather';
import type { useAirQuality } from '../../features/air-quality/hooks/useAirQuality';
import type { useNWSAlerts } from '../../features/weather/hooks/useNWSAlerts';
import type { useNews } from '../../features/news/hooks/useNews';
import type { useCurrencyStore } from '../../stores/currencyStore';
import type { useIslamicStore } from '../../stores/prayerTimesStore';
import type { MarketState } from '../../features/markets/model';
import type { AppSettings } from '../../types';

export type SourceTime = { kind: 'instant'; iso: string } | { kind: 'local'; value: string; timezone: string } | { kind: 'date'; value: string } | { kind: 'unknown' };
export interface PresentedValue<T> {
  readonly value: T | null;
  readonly contextKey: string;
  readonly availability: 'loading' | 'available' | 'empty' | 'unsupported' | 'disabled' | 'unavailable';
  readonly freshness: DataFreshness;
  readonly source: string;
  readonly sourceTime: SourceTime;
  readonly successfulFetchAt: string | null;
  readonly origin: 'network' | 'cache' | 'calculated' | 'demo' | 'unknown';
  readonly lastCheck: { readonly at: string; readonly outcome: 'new' | 'unchanged' | 'cached' | 'partial' | 'failed' } | null;
  readonly refreshing: boolean;
  readonly partial: boolean;
  readonly qualifiers: readonly string[];
}

/** A pure projection of accepted owner state; it cannot repair identity or infer observation times. */
export function presentValue<T>(value: T | null, input: Omit<PresentedValue<T>, 'value' | 'freshness'> & { freshness: DataFreshness }): PresentedValue<T> {
  const usable = input.availability === 'available' || input.availability === 'empty';
  return { ...input, value: usable ? value : null, freshness: value === null || !usable ? 'unavailable' : input.freshness };
}
function localTime(value?: string, timezone?: string): SourceTime {
  return value && timezone ? { kind: 'local', value, timezone } : { kind: 'unknown' };
}
function ageFreshness(freshness: DataFreshness, fetchedAt: string | null, ttl: number, now: number): DataFreshness {
  return fetchedAt && now - Date.parse(fetchedAt) > ttl ? 'stale' : freshness;
}
interface SnapshotInput {
  settings: AppSettings;
  weather: ReturnType<typeof useWeather>;
  airQuality: ReturnType<typeof useAirQuality>;
  nws: ReturnType<typeof useNWSAlerts>;
  news: ReturnType<typeof useNews>;
  currency: ReturnType<typeof useCurrencyStore.getState>;
  islamic: ReturnType<typeof useIslamicStore.getState>;
  marketState: MarketState;
}
export function buildBriefSnapshot(input: SnapshotInput, now = Date.now()) {
  const { weather, airQuality, nws, news, currency, islamic, marketState, settings } = input;
  const weatherData = 'data' in weather.weatherState ? weather.weatherState.data : null;
  const aqiData = 'data' in airQuality.aqiState ? airQuality.aqiState.data : null;
  const weatherMetadata = weather.metadata;
  const aqiMetadata = airQuality.metadata;
  const rate = settings.currencyEnabled && currency.rate && now - Date.parse(currency.rate.fetchedAt) <= 36 * 60 * 60_000 && `${currency.rate.base}/${currency.rate.quote}` === settings.currencyPair ? currency.rate : null;
  const base = { lastCheck: null, refreshing: false, partial: false, qualifiers: [] as readonly string[], sourceTime: { kind: 'unknown' } as SourceTime, successfulFetchAt: null, origin: 'unknown' as const };
  const marketSnapshot = 'snapshot' in marketState ? marketState.snapshot : null;
  const headlines = 'featured' in news.newsState ? [news.newsState.featured, ...news.newsState.secondary] : news.newsState.status === 'empty' ? [] : null;
  return {
    weather: presentValue(weatherData, { ...base, contextKey: weatherMetadata?.contextKey ?? '', availability: weatherData ? 'available' : weather.weatherState.status === 'loading' ? 'loading' : 'unavailable', source: 'Open-Meteo', lastCheck: weatherMetadata?.lastCheck ?? null, refreshing: weather.isRefreshing, sourceTime: localTime(weatherData?.observedAt, weatherData?.timezone), successfulFetchAt: weatherMetadata?.successfulFetchAt ?? null, origin: weatherMetadata?.origin ?? 'unknown', freshness: ageFreshness(weatherMetadata?.freshness ?? 'delayed', weatherMetadata?.successfulFetchAt ?? null, 15 * 60_000, now), qualifiers: ['Weather, forecast, UV and daylight; source timing is not verified as live'] }),
    airQuality: presentValue(aqiData, { ...base, contextKey: aqiMetadata?.contextKey ?? '', availability: aqiData ? 'available' : airQuality.aqiState.status === 'loading' ? 'loading' : 'unavailable', source: 'Open-Meteo', lastCheck: aqiMetadata?.lastCheck ?? null, refreshing: airQuality.isRefreshing, sourceTime: localTime(aqiData?.measuredAt, aqiData?.timezone), successfulFetchAt: aqiMetadata?.successfulFetchAt ?? null, origin: aqiMetadata?.origin ?? 'unknown', freshness: ageFreshness(aqiMetadata?.freshness ?? 'delayed', aqiMetadata?.successfulFetchAt ?? null, 30 * 60_000, now), partial: aqiData?.usAqi === null, qualifiers: ['Observation timing is not verified as live'] }),
    alerts: presentValue(nws.coverage === 'unsupported' || nws.coverage === 'unknown' || nws.coverage === 'unavailable' && !nws.alerts.length ? null : nws.alerts, { ...base, contextKey: nws.metadata?.contextKey ?? '', availability: nws.coverage === 'active' ? 'available' : nws.coverage === 'none' ? 'empty' : nws.coverage === 'checking' ? 'loading' : nws.coverage === 'unsupported' || nws.coverage === 'unknown' ? 'unsupported' : 'unavailable', source: 'National Weather Service', successfulFetchAt: nws.metadata?.successfulFetchAt ?? null, origin: !nws.metadata?.successfulFetchAt ? 'unknown' : nws.metadata.origin === 'cache' ? 'cache' : 'network', freshness: nws.metadata?.origin === 'cache' ? 'stale' : 'delayed', qualifiers: [nws.coverage] }),
    currency: presentValue(rate, { ...base, contextKey: settings.currencyPair, availability: !settings.currencyEnabled ? 'disabled' : rate ? 'available' : currency.rateLoading ? 'loading' : 'unavailable', source: 'Frankfurter', sourceTime: rate ? { kind: 'date', value: rate.date } : base.sourceTime, successfulFetchAt: rate?.fetchedAt ?? null, origin: currency.rateOrigin ?? 'unknown', freshness: ageFreshness(currency.isStale ? 'stale' : currency.rateOrigin === 'cache' ? 'cached' : 'end-of-day', rate?.fetchedAt ?? null, 12 * 60 * 60_000, now), qualifiers: rate ? [`Reference · ${rate.date}`] : [] }),
    prayer: presentValue(settings.islamic.enabled ? islamic.todaySchedule : null, { ...base, contextKey: islamic.contextKey ?? '', availability: !settings.islamic.enabled ? 'disabled' : islamic.todaySchedule ? 'available' : islamic.loading ? 'loading' : 'unavailable', source: 'AlAdhan', sourceTime: islamic.todaySchedule ? { kind: 'date', value: islamic.todaySchedule.gregorianDate } : base.sourceTime, successfulFetchAt: islamic.todaySchedule?.provenance?.successfulFetchAt ?? null, origin: islamic.isStale ? 'cache' : 'calculated', freshness: islamic.isStale ? 'stale' : 'delayed', partial: !islamic.tomorrowSchedule, qualifiers: ['Calculated schedule'] }),
    news: presentValue(headlines, { ...base, contextKey: news.feedMetadata?.contextKey ?? '', availability: headlines ? headlines.length ? 'available' : 'empty' : news.newsState.status === 'loading' ? 'loading' : 'unavailable', source: 'Currents static feed', sourceTime: news.feedMetadata ? { kind: 'instant', iso: news.feedMetadata.generatedAt } : base.sourceTime, successfulFetchAt: news.feedMetadata?.successfulFetchAt ?? null, origin: news.feedMetadata?.origin ?? 'unknown', freshness: news.feedMetadata && isGeneratedFeedStale({ generatedAt: news.feedMetadata.generatedAt }, now) ? 'stale' : news.feedMetadata?.origin === 'cache' ? 'cached' : 'delayed', partial: news.feedMetadata?.partial ?? false, qualifiers: news.feedMetadata?.partial ? ['Partial feed; retained category age unknown'] : ['Scheduled feed'] }),
    markets: marketSnapshot?.instruments.map((row) => presentValue(row, { ...base, contextKey: row.symbol, availability: 'available', source: 'Finnhub static snapshot', sourceTime: row.providerTimestamp ? { kind: 'instant', iso: row.providerTimestamp } : base.sourceTime, successfulFetchAt: 'browserFetchedAt' in marketState ? marketState.browserFetchedAt : null, origin: 'origin' in marketState ? marketState.origin ?? 'unknown' : 'unknown', freshness: row.stale || isSnapshotStale(marketSnapshot, now) || marketState.status === 'stale' ? 'stale' : marketState.status === 'cached' ? 'cached' : 'delayed', partial: marketSnapshot.freshness === 'partial', qualifiers: [`Snapshot generated ${marketSnapshot.generatedAt}`, 'Quote delay is not guaranteed'] })) ?? [],
  };
}
