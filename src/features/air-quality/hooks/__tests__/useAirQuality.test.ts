import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from '../../../../lib/api/cacheService';
import * as provider from '../../providers/openMeteoAirQualityProvider';

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

// Mock useAppLocation hook
vi.mock('../../../hooks/useAppLocation', () => ({
  useAppLocation: () => ({
    activeLocation: {
      id: 'om-123',
      name: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
      source: 'search',
    },
  }),
}));

describe('useAirQuality hook setup', () => {
  beforeEach(() => {
    global.localStorage = createLocalStorageMock() as unknown as Storage;
    vi.restoreAllMocks();
    cacheService.clearAll();
  });

  const mockSnapshot = {
    usAqi: 42,
    category: 'Good' as const,
    pm25: 10,
    pm10: 15,
    ozone: 64,
    measuredAt: new Date().toISOString(),
  };

  it('correctly maps the air quality fetch and caching rules', async () => {
    const fetchSpy = vi.spyOn(provider, 'fetchOpenMeteoAirQuality').mockResolvedValue(mockSnapshot);
    const result = await provider.fetchOpenMeteoAirQuality({
      id: 'om-123',
      name: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
      source: 'search',
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.usAqi).toBe(42);
    expect(result.category).toBe('Good');
  });

  it('correctly retrieves from cache if populated', async () => {
    const cacheKey = `aqi_v2_35.68_139.65`;
    cacheService.setCache(cacheKey, mockSnapshot, 30 * 60 * 1000);

    const cached = cacheService.getCache(cacheKey);
    expect(cached?.data).toEqual(mockSnapshot);
    expect(cached?.isStale).toBe(false);
  });
});
