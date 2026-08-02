import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '../cacheService';

// In-memory mock for localStorage in Node testing environment
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

describe('cacheService', () => {
  beforeEach(() => {
    global.localStorage = createLocalStorageMock() as unknown as Storage;
    vi.restoreAllMocks();
  });

  it('stores and retrieves items correctly when fresh', () => {
    const data = { temp: 75, condition: 'Clear' };
    cacheService.setCache('weather_test', data, 60000); // 1 minute TTL

    const result = cacheService.getCache<typeof data>('weather_test');
    expect(result).not.toBeNull();
    expect(result?.data).toEqual(data);
    expect(result?.isStale).toBe(false);
  });

  it('marks cached item as stale when past TTL but within grace period', () => {
    const data = { headline: 'Breaking News' };
    const pastDate = new Date(Date.now() - 10000).toISOString();
    const expiresDate = new Date(Date.now() - 5000).toISOString();

    const rawRecord = {
      data,
      fetchedAt: pastDate,
      expiresAt: expiresDate,
      version: 1,
    };

    localStorage.setItem('ambient_brief_v1_news_test', JSON.stringify(rawRecord));

    const result = cacheService.getCache<typeof data>('news_test');
    expect(result).not.toBeNull();
    expect(result?.data).toEqual(data);
    expect(result?.isStale).toBe(true);
  });

  it('purges and returns null for corrupted JSON cache entries', () => {
    localStorage.setItem('ambient_brief_v1_corrupt_test', '{ invalid json ...');

    const result = cacheService.getCache('corrupt_test');
    expect(result).toBeNull();
    expect(localStorage.getItem('ambient_brief_v1_corrupt_test')).toBeNull();
  });

  it('purges and returns null for malformed cache schema records', () => {
    localStorage.setItem('ambient_brief_v1_malformed_test', JSON.stringify({ wrongKey: 123 }));

    const result = cacheService.getCache('malformed_test');
    expect(result).toBeNull();
    expect(localStorage.getItem('ambient_brief_v1_malformed_test')).toBeNull();
  });

  it('safely handles localStorage write exceptions without crashing', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      cacheService.setCache('quota_test', { value: 1 }, 1000);
    }).not.toThrow();
  });
});
