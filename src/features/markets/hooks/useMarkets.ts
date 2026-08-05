import { useCallback, useRef, useState } from 'react';
import type { ProviderRefreshResult } from '../../../app/refreshCoordinator';
import type { MarketSnapshot, MarketState } from '../model';
import { clearMarketCache, isMarketCacheStale, loadMarketSnapshot } from '../marketSnapshotClient';

const ACTIVE_SESSION_STALE_AFTER_MS = 90 * 60 * 1_000;
const CLOSED_SESSION_STALE_AFTER_MS = 24 * 60 * 60 * 1_000;

export function isSnapshotStale(snapshot: MarketSnapshot, now = Date.now()): boolean {
  const generatedAt = Date.parse(snapshot.generatedAt);
  if (Number.isNaN(generatedAt)) return true;
  const active = snapshot.marketSession === 'pre-market'
    || snapshot.marketSession === 'regular'
    || snapshot.marketSession === 'after-hours';
  return now - generatedAt > (active ? ACTIVE_SESSION_STALE_AFTER_MS : CLOSED_SESSION_STALE_AFTER_MS);
}

export function useMarkets() {
  const [marketState, setMarketState] = useState<MarketState>({ status: 'loading' });
  const currentSnapshotRef = useRef<MarketSnapshot | undefined>(undefined);

  const loadMarkets = useCallback(async (
    forceRefresh = false,
    signal?: AbortSignal,
  ): Promise<ProviderRefreshResult> => {
    const previousGeneratedAt = currentSnapshotRef.current?.generatedAt;
    const result = await loadMarketSnapshot(forceRefresh, signal);
    if (result.status === 'success') {
      const snapshot = result.data;
      currentSnapshotRef.current = snapshot;
      const stale = isSnapshotStale(snapshot) || result.freshness === 'stale' || snapshot.freshness === 'stale';
      const status = snapshot.freshness === 'partial'
        ? 'partial'
        : stale
          ? 'stale'
          : result.source === 'cache' || snapshot.freshness === 'cached'
            ? 'cached'
            : 'loaded';
      const unchanged = forceRefresh && previousGeneratedAt === snapshot.generatedAt;
      setMarketState({
        status,
        snapshot,
        browserFetchedAt: result.fetchedAt,
        ...(forceRefresh ? {
          notice: unchanged
            ? 'Already showing the latest available market snapshot.'
            : 'Checked for a newer market snapshot.',
        } : {}),
      });
      return result.source === 'cache' ? 'cached' : 'success';
    }

    setMarketState((current) => {
      if (current.status !== 'loading' && current.status !== 'unavailable') {
        return { ...current, notice: 'Could not check for a newer snapshot. Keeping the last valid market data.' };
      }
      return {
        status: 'unavailable',
        message: 'The scheduled data workflow has not published a valid snapshot yet.',
        ...(forceRefresh ? { notice: 'The latest market snapshot could not be checked.' } : {}),
      };
    });
    if (result.status === 'error') throw result.error;
    throw new Error('Market snapshot request did not complete.');
  }, []);

  const clearCache = useCallback(() => {
    clearMarketCache();
    setMarketState({
      status: 'unavailable',
      message: 'Local market data was cleared. Check for the latest published snapshot.',
    });
  }, []);

  return {
    marketState,
    loadMarkets,
    clearMarketCache: clearCache,
    isMarketStale: isMarketCacheStale,
  };
}
