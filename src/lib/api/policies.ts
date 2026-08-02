/**
 * Centralized Request & Cache Policies
 * Defines freshness TTLs and refresh rules for each information domain.
 */

export interface DomainPolicy {
  domainId: string;
  domainName: string;
  ttlMs: number;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * Calculates remaining milliseconds until the next local midnight
 */
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export const REQUEST_POLICIES: Record<string, DomainPolicy> = {
  weather: {
    domainId: 'weather',
    domainName: 'Current Weather',
    ttlMs: 15 * MINUTE_MS, // 15 minutes
  },
  hourlyForecast: {
    domainId: 'hourlyForecast',
    domainName: 'Hourly Forecast',
    ttlMs: 30 * MINUTE_MS, // 30 minutes
  },
  airQuality: {
    domainId: 'airQuality',
    domainName: 'Air Quality Index',
    ttlMs: 30 * MINUTE_MS, // 30 minutes
  },
  weatherAlerts: {
    domainId: 'weatherAlerts',
    domainName: 'Severe Weather Alerts',
    ttlMs: 10 * MINUTE_MS, // 10 minutes
  },
  news: {
    domainId: 'news',
    domainName: 'News Feed',
    ttlMs: 20 * MINUTE_MS, // 20 minutes
  },
  currency: {
    domainId: 'currency',
    domainName: 'Currency Exchange Rates',
    ttlMs: 12 * HOUR_MS, // 12 hours
  },
  prayerTimes: {
    domainId: 'prayerTimes',
    domainName: 'Islamic Prayer Schedule',
    get ttlMs() {
      return msUntilMidnight(); // Valid until local midnight
    },
  },
  markets: {
    domainId: 'markets',
    domainName: 'Financial Markets Data',
    ttlMs: 4 * HOUR_MS, // 4 hours
  },
};
