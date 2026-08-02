import { MarketInstrument, ProviderUsage } from '../../lib/types';
import { apiFetch } from '../../lib/api/apiClient';

const USAGE_STORAGE_KEY = 'ambient_brief_av_usage_v1';
const MAX_DAILY_REQUESTS = 20;

export const ETF_PROXIES: Record<string, { displayName: string; proxyFor: string }> = {
  SPY: { displayName: 'S&P 500 proxy · SPY', proxyFor: 'S&P 500' },
  DIA: { displayName: 'Dow proxy · DIA', proxyFor: 'Dow Jones' },
  QQQ: { displayName: 'Nasdaq-100 proxy · QQQ', proxyFor: 'Nasdaq-100' },
};

export const DEFAULT_COMPANIES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  NVDA: 'NVIDIA Corp.',
  AMZN: 'Amazon.com Inc.',
  GOOGL: 'Alphabet Inc.',
  META: 'Meta Platforms Inc.',
  TSLA: 'Tesla Inc.',
  NFLX: 'Netflix Inc.',
};

export function getProviderUsage(): ProviderUsage {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (raw) {
      const parsed: ProviderUsage = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read AV usage from localStorage', err);
  }
  return {
    provider: 'alpha-vantage',
    date: today,
    requestsAttempted: 0,
    requestsSucceeded: 0,
  };
}

export function recordUsage(success: boolean) {
  const usage = getProviderUsage();
  usage.requestsAttempted += 1;
  if (success) {
    usage.requestsSucceeded += 1;
  }
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch (err) {
    console.warn('Failed to save AV usage to localStorage', err);
  }
}

export function getUSMarketSessionState(): { statusText: string; isOpen: boolean } {
  try {
    const now = new Date();
    const nyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = nyFormatter.formatToParts(now);
    const weekday = parts.find((p) => p.type === 'weekday')?.value;
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const totalMinutes = hour * 60 + minute;
    const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
    const marketCloseMinutes = 16 * 60; // 4:00 PM

    if (!isWeekend && totalMinutes >= marketOpenMinutes && totalMinutes <= marketCloseMinutes) {
      return { statusText: 'Regular session likely open', isOpen: true };
    } else {
      return {
        statusText: 'Regular session closed · Market holiday status not independently verified',
        isOpen: false,
      };
    }
  } catch {
    return {
      statusText: 'Regular session closed · Market holiday status not independently verified',
      isOpen: false,
    };
  }
}

export type KeyTestResult =
  | 'valid'
  | 'invalid'
  | 'rate_limited'
  | 'quota_exhausted'
  | 'network_error'
  | 'blocked'
  | 'unknown';

export async function testAlphaVantageKey(apiKey: string): Promise<KeyTestResult> {
  if (!apiKey || !apiKey.trim()) return 'invalid';
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${apiKey.trim()}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      if (res.status === 429) return 'rate_limited';
      if (res.status === 403 || res.status === 401) return 'invalid';
      return 'network_error';
    }
    const data = await res.json();
    if (data['Error Message']) return 'invalid';
    if (data['Note'] || data['Information']) {
      const msg = (data['Note'] || data['Information']).toLowerCase();
      if (msg.includes('frequency') || msg.includes('rate limit')) return 'rate_limited';
      if (msg.includes('call limit') || msg.includes('25 requests') || msg.includes('per day')) return 'quota_exhausted';
    }
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return 'valid';
    }
    return 'unknown';
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('CORS')) {
      return 'blocked';
    }
    return 'network_error';
  }
}

const SYMBOL_CACHE_PREFIX = 'ambient_brief_av_sym_v1_';

export async function fetchMarketInstruments(
  symbols: string[],
  userApiKey?: string,
  forceRefresh = false
): Promise<{ instruments: MarketInstrument[]; usage: ProviderUsage; errorStatus?: string }> {
  const apiKey = (userApiKey || '').trim();
  if (!apiKey) {
    throw new Error('API key required');
  }

  const usage = getProviderUsage();
  if (usage.requestsAttempted >= MAX_DAILY_REQUESTS) {
    throw new Error('Daily advisory budget reached (20 requests).');
  }

  const results: MarketInstrument[] = [];
  const sessionState = getUSMarketSessionState();
  const now = Date.now();

  // Freshness threshold: 4 hours during weekdays if market open, or 12 hours otherwise
  const cacheTtl = sessionState.isOpen ? 4 * 3600 * 1000 : 12 * 3600 * 1000;

  for (const sym of symbols) {
    const cacheKey = `${SYMBOL_CACHE_PREFIX}${sym}`;
    let cachedItem: { data: MarketInstrument; fetchedAt: number } | null = null;
    try {
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) {
        cachedItem = JSON.parse(rawCache);
      }
    } catch {
      // ignore cache read error
    }

    // Check if fresh cache exists and not forcing refresh
    if (!forceRefresh && cachedItem && now - cachedItem.fetchedAt < cacheTtl) {
      results.push(cachedItem.data);
      continue;
    }

    // Check advisory budget
    const currentUsage = getProviderUsage();
    if (currentUsage.requestsAttempted >= MAX_DAILY_REQUESTS) {
      // If we hit advisory limit, fallback to cached data if available or stop
      if (cachedItem) {
        results.push({ ...cachedItem.data, dataStatus: 'stale' });
      }
      continue;
    }

    // Fetch from Alpha Vantage GLOBAL_QUOTE
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${apiKey}`;
    try {
      recordUsage(false); // temporary increment attempt
      const data = await apiFetch<any>(url, { providerId: 'markets', timeoutMs: 6000 });

      if (data?.['Error Message']) {
        throw new Error('Invalid API key or symbol');
      }

      if (data?.['Note'] || data?.['Information']) {
        const msg = data['Note'] || data['Information'];
        if (msg.toLowerCase().includes('frequency') || msg.toLowerCase().includes('rate')) {
          throw new Error('Rate limited by Alpha Vantage');
        }
        if (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('per day')) {
          throw new Error('Daily quota exhausted');
        }
      }

      const quote = data?.['Global Quote'];
      if (quote && quote['05. price']) {
        // Correctly update successful usage count
        const u = getProviderUsage();
        u.requestsSucceeded += 1;
        try {
          localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(u));
        } catch {}

        const price = parseFloat(quote['05. price']);
        const changePercentRaw = quote['10. change percent'] || '0%';
        const changePercent = parseFloat(changePercentRaw.replace('%', '')) || 0;
        const prevClose = parseFloat(quote['08. previous close']) || price;
        const change = parseFloat(quote['09. change']) || (price - prevClose);
        const priceDate = quote['07. latest trading day'] || new Date().toISOString().slice(0, 10);

        const isProxy = !!ETF_PROXIES[sym];
        const instrumentType = isProxy ? 'etf-proxy' : 'company';
        const displayName = isProxy
          ? ETF_PROXIES[sym].displayName
          : DEFAULT_COMPANIES[sym] || `${sym} Corp.`;
        const proxyFor = isProxy ? ETF_PROXIES[sym].proxyFor : undefined;

        // Approximate sparkline from open/high/low/price
        const open = parseFloat(quote['02. open']) || prevClose;
        const high = parseFloat(quote['03. high']) || Math.max(open, price);
        const low = parseFloat(quote['04. low']) || Math.min(open, price);
        const sparklineData = [
          { time: '9:30', value: open },
          { time: '11:00', value: low },
          { time: '12:30', value: (open + price) / 2 },
          { time: '14:00', value: high },
          { time: '16:00', value: price },
        ];

        const instrument: MarketInstrument = {
          symbol: sym,
          displayName,
          instrumentType,
          proxyFor,
          latestPrice: price,
          previousClose: prevClose,
          change,
          changePercent,
          priceDate,
          fetchedAt: new Date().toISOString(),
          dataStatus: 'end-of-day',
          source: 'Alpha Vantage',
          sparklineData,
          // legacy compatibility fields
          name: displayName,
          category: isProxy ? 'index' : 'stock',
          price,
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: instrument, fetchedAt: now }));
        } catch {}

        results.push(instrument);

        // Conservative delay between requests (300ms)
        await new Promise((r) => setTimeout(r, 300));
      } else if (cachedItem) {
        // Fallback to cache if quote missing
        results.push({ ...cachedItem.data, dataStatus: 'stale' });
      }
    } catch (err: any) {
      console.warn(`Failed to fetch symbol ${sym}:`, err);
      if (cachedItem) {
        results.push({ ...cachedItem.data, dataStatus: 'stale' });
      }
      if (err.message && (err.message.includes('Rate limited') || err.message.includes('quota'))) {
        throw err;
      }
    }
  }

  return {
    instruments: results,
    usage: getProviderUsage(),
  };
}
