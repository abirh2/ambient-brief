/**
 * Client-Side Versioned Cache Service
 * Provides fail-soft localStorage caching with TTL, staleness detection,
 * and malformed entry recovery.
 */

const CACHE_PREFIX = 'ambient_brief_v1_';

export interface CacheRecord<T> {
  data: T;
  fetchedAt: string; // ISO String
  expiresAt: string; // ISO String
  version: number;
}

export interface CachedDataResult<T> {
  data: T;
  fetchedAt: string;
  isStale: boolean;
}

export const cacheService = {
  /**
   * Store item in cache with a TTL in milliseconds.
   */
  setCache<T>(key: string, data: T, ttlMs: number): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const now = new Date();
      const expires = new Date(now.getTime() + ttlMs);

      const record: CacheRecord<T> = {
        data,
        fetchedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        version: 1,
      };

      const fullKey = `${CACHE_PREFIX}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(record));
    } catch (err) {
      // Fail-soft on localStorage quota exceeded or restricted storage
      console.warn(`[CacheService] Failed to set cache for key "${key}":`, err);
    }
  },

  /**
   * Retrieve item from cache if it exists.
   * Returns data with staleness flag, or null if missing/expired/malformed.
   */
  getCache<T>(key: string): CachedDataResult<T> | null {
    if (typeof localStorage === 'undefined') return null;
    const fullKey = `${CACHE_PREFIX}${key}`;
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;

      const record = JSON.parse(raw) as CacheRecord<T>;

      if (!record || typeof record !== 'object' || !record.fetchedAt || !record.expiresAt || record.data === undefined) {
        // Malformed cache record - purge
        this.clearKey(key);
        return null;
      }

      const now = new Date().getTime();
      const expiresAt = new Date(record.expiresAt).getTime();
      const fetchedAt = new Date(record.fetchedAt).getTime();

      if (isNaN(expiresAt) || isNaN(fetchedAt)) {
        this.clearKey(key);
        return null;
      }

      // Check if entry is past expiration (hard expiry = 2x TTL or explicit expiresAt)
      if (now > expiresAt + ttlGracePeriodMs(expiresAt - fetchedAt)) {
        // Expired completely
        this.clearKey(key);
        return null;
      }

      // Is it soft-stale? (past expiresAt, but within grace period)
      const isStale = now > expiresAt;

      return {
        data: record.data,
        fetchedAt: record.fetchedAt,
        isStale,
      };
    } catch (err) {
      console.warn(`[CacheService] Failed to read or parse cache for key "${key}":`, err);
      this.clearKey(key);
      return null;
    }
  },

  /**
   * Remove a specific key from cache.
   */
  clearKey(key: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Clear all Ambient Brief cache records.
   */
  clearAll(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  },
};

/**
 * Grace period during which stale data can still be rendered while revalidating
 */
function ttlGracePeriodMs(ttlMs: number): number {
  // Allow stale cache to be served for up to 1 additional TTL duration or 24h max
  return Math.min(Math.max(ttlMs, 300000), 86400000);
}
