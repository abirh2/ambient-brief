interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheItem<unknown>> = new Map();

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public set<T>(key: string, data: T, ttlMs: number = 300000): void {
    const expiry = Date.now() + ttlMs;
    this.memoryCache.set(key, { data, expiry });
  }

  public get<T>(key: string): T | null {
    const item = this.memoryCache.get(key) as CacheItem<T> | undefined;
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.data;
  }

  public clear(): void {
    this.memoryCache.clear();
  }
}

export const cacheManager = CacheManager.getInstance();
