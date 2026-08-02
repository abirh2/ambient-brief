import { CachePolicy } from './cacheService';

const MINUTE_MS = 60 * 1_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export type CachePolicyName =
  | 'weather'
  | 'hourlyForecast'
  | 'airQuality'
  | 'nwsAlerts'
  | 'news'
  | 'currency'
  | 'prayerSchedule';

export interface DomainPolicy extends CachePolicy {
  domainId: CachePolicyName;
  domainName: string;
  /** Compatibility accessor for existing feature code. */
  readonly ttlMs: number;
}

function timedPolicy(
  domainId: CachePolicyName,
  domainName: string,
  freshForMs: number,
  staleForMs = DAY_MS,
): DomainPolicy {
  return { domainId, domainName, freshForMs, staleForMs, ttlMs: freshForMs };
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function millisecondsUntilLocalDateChanges(now: Date): number {
  const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return nextDate.getTime() - now.getTime();
}

const prayerSchedulePolicy: DomainPolicy = {
  domainId: 'prayerSchedule',
  domainName: 'Prayer Schedule',
  freshForMs: millisecondsUntilLocalDateChanges,
  staleForMs: 0,
  validityKey: localDateKey,
  get ttlMs() {
    return millisecondsUntilLocalDateChanges(new Date());
  },
};

export const CACHE_POLICIES: Record<CachePolicyName, DomainPolicy> = {
  weather: timedPolicy('weather', 'Current Weather', 15 * MINUTE_MS),
  hourlyForecast: timedPolicy('hourlyForecast', 'Hourly Forecast', 30 * MINUTE_MS),
  airQuality: timedPolicy('airQuality', 'Air Quality', 30 * MINUTE_MS),
  nwsAlerts: timedPolicy('nwsAlerts', 'NWS Alerts', 10 * MINUTE_MS),
  news: timedPolicy('news', 'News', 20 * MINUTE_MS),
  currency: timedPolicy('currency', 'Currency', 12 * HOUR_MS),
  prayerSchedule: prayerSchedulePolicy,
};

/** Legacy names retained until feature providers are migrated onto the new coordinator. */
export const REQUEST_POLICIES = {
  ...CACHE_POLICIES,
  weatherAlerts: CACHE_POLICIES.nwsAlerts,
  prayerTimes: CACHE_POLICIES.prayerSchedule,
  markets: timedPolicy('currency', 'Financial Markets', 4 * HOUR_MS),
};
