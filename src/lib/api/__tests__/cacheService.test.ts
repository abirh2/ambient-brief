import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheService } from '../cacheService';

const createLocalStorageMock = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => Object.keys(store)[index] ?? null,
  };
};

describe('cacheService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-02T12:00:00.000Z'));
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  it('reports fresh, stale, and expired cache states', () => {
    const policy = { freshForMs: 1_000, staleForMs: 2_000 };
    cacheService.setCache('weather', { temperature: 75 }, policy);
    expect(cacheService.readCache('weather', policy).state).toBe('fresh');

    vi.advanceTimersByTime(1_001);
    expect(cacheService.readCache('weather', policy).state).toBe('stale');

    vi.advanceTimersByTime(2_000);
    expect(cacheService.readCache('weather', policy).state).toBe('expired');
  });

  it('purges malformed and wrong-version cache records', () => {
    localStorage.setItem('ambient_brief_api_v2_broken', '{not json');
    expect(cacheService.readCache('broken')).toEqual({ state: 'miss' });
    expect(localStorage.getItem('ambient_brief_api_v2_broken')).toBeNull();

    localStorage.setItem(
      'ambient_brief_api_v2_old',
      JSON.stringify({ version: 1, data: {}, fetchedAt: '', freshUntil: '', expiresAt: '' }),
    );
    expect(cacheService.readCache('old')).toEqual({ state: 'miss' });
  });

  it('fails softly when browser storage rejects a write', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    expect(() => cacheService.setCache('weather', {}, 1_000)).not.toThrow();
  });
});
