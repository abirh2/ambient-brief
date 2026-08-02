/** Fail-soft, versioned local cache with explicit freshness states. */

const CACHE_VERSION = 2;
const CACHE_PREFIX = `ambient_brief_api_v${CACHE_VERSION}_`;
const LEGACY_PREFIX = 'ambient_brief_v1_';
const DEFAULT_STALE_FOR_MS = 24 * 60 * 60 * 1_000;

export interface CachePolicy {
  freshForMs: number | ((now: Date) => number);
  staleForMs?: number;
  validityKey?: (now: Date) => string;
}

interface CacheRecord<T> {
  version: number;
  data: T;
  fetchedAt: string;
  freshUntil: string;
  expiresAt: string;
  validityKey?: string;
}

interface CacheValue<T> {
  data: T;
  fetchedAt: string;
}

export type CacheReadResult<T> =
  | ({ state: 'fresh' | 'stale' } & CacheValue<T>)
  | ({ state: 'expired' } & CacheValue<T>)
  | { state: 'miss' };

/** Compatibility result for feature code using the original cache API. */
export interface CachedDataResult<T> extends CacheValue<T> {
  isStale: boolean;
}

export const cacheService = {
  setCache<T>(key: string, data: T, policyOrFreshMs: CachePolicy | number): void {
    const storage = getStorage();
    if (!storage) return;

    try {
      const now = new Date();
      const policy = normalizePolicy(policyOrFreshMs);
      const freshForMs = resolveDuration(policy.freshForMs, now);
      const staleForMs = policy.staleForMs ?? DEFAULT_STALE_FOR_MS;
      const record: CacheRecord<T> = {
        version: CACHE_VERSION,
        data,
        fetchedAt: now.toISOString(),
        freshUntil: new Date(now.getTime() + freshForMs).toISOString(),
        expiresAt: new Date(now.getTime() + freshForMs + staleForMs).toISOString(),
        validityKey: policy.validityKey?.(now),
      };
      storage.setItem(fullKey(key), JSON.stringify(record));
    } catch (cause) {
      diagnosticWarning(`Unable to write cache key "${key}".`, cause);
    }
  },

  readCache<T>(key: string, policy?: CachePolicy): CacheReadResult<T> {
    const storage = getStorage();
    if (!storage) return { state: 'miss' };

    try {
      const raw = storage.getItem(fullKey(key));
      if (!raw) return { state: 'miss' };
      const parsed: unknown = JSON.parse(raw);
      if (!isCacheRecord<T>(parsed)) {
        storage.removeItem(fullKey(key));
        return { state: 'miss' };
      }

      const fetchedAtMs = Date.parse(parsed.fetchedAt);
      const freshUntilMs = Date.parse(parsed.freshUntil);
      const expiresAtMs = Date.parse(parsed.expiresAt);
      if ([fetchedAtMs, freshUntilMs, expiresAtMs].some(Number.isNaN)) {
        storage.removeItem(fullKey(key));
        return { state: 'miss' };
      }

      const value = { data: parsed.data, fetchedAt: parsed.fetchedAt };
      const now = new Date();
      if (policy?.validityKey && parsed.validityKey !== policy.validityKey(now)) {
        return { state: 'expired', ...value };
      }
      if (now.getTime() <= freshUntilMs) return { state: 'fresh', ...value };
      if (now.getTime() <= expiresAtMs) return { state: 'stale', ...value };
      return { state: 'expired', ...value };
    } catch (cause) {
      diagnosticWarning(`Unable to read cache key "${key}".`, cause);
      try {
        storage.removeItem(fullKey(key));
      } catch {
        // Storage may be unavailable; cache failures never break the app.
      }
      return { state: 'miss' };
    }
  },

  getCache<T>(key: string): CachedDataResult<T> | null {
    const result = this.readCache<T>(key);
    if (result.state === 'miss' || result.state === 'expired') return null;
    return {
      data: result.data,
      fetchedAt: result.fetchedAt,
      isStale: result.state === 'stale',
    };
  },

  clearKey(key: string): void {
    try {
      const storage = getStorage();
      storage?.removeItem(fullKey(key));
      storage?.removeItem(`${LEGACY_PREFIX}${key}`);
    } catch {
      // Cache cleanup is best effort.
    }
  },

  clearAll(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith('ambient_brief_api_v') || key?.startsWith(LEGACY_PREFIX)) keys.push(key);
      }
      keys.forEach((key) => storage.removeItem(key));
    } catch {
      // Cache cleanup is best effort.
    }
  },
};

function normalizePolicy(policyOrFreshMs: CachePolicy | number): CachePolicy {
  return typeof policyOrFreshMs === 'number'
    ? { freshForMs: policyOrFreshMs }
    : policyOrFreshMs;
}

function resolveDuration(value: CachePolicy['freshForMs'], now: Date): number {
  const duration = typeof value === 'function' ? value(now) : value;
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error('Cache durations must be non-negative finite numbers.');
  }
  return duration;
}

function isCacheRecord<T>(value: unknown): value is CacheRecord<T> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === CACHE_VERSION &&
    'data' in record &&
    typeof record.fetchedAt === 'string' &&
    typeof record.freshUntil === 'string' &&
    typeof record.expiresAt === 'string' &&
    (record.validityKey === undefined || typeof record.validityKey === 'string')
  );
}

function fullKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function diagnosticWarning(message: string, cause: unknown): void {
  if (import.meta.env.DEV) console.warn(`[api-cache] ${message}`, cause);
}
