import { z } from 'zod';
import { cacheService } from './cacheService';

export function readContextCache<T>(key: string, contextKey: string, schema: z.ZodType<T>) {
  const cached = cacheService.getCache<unknown>(key);
  if (!cached) return null;
  const parsed = z.object({ contextKey: z.literal(contextKey), value: schema }).safeParse(cached.data);
  if (!parsed.success) { cacheService.clearKey(key); return null; }
  return { ...cached, data: parsed.data.value };
}

export interface AcceptedMetadata {
  contextKey: string;
  successfulFetchAt: string | null;
  origin: 'network' | 'cache' | 'demo';
  lastCheck?: { at: string; outcome: 'new' | 'cached' | 'failed' };
  freshness: 'cached' | 'stale' | 'demo' | 'delayed';
}
