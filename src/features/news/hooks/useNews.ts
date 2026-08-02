import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { cacheService } from '../../../lib/api/cacheService';
import { fetchNewsHeadlines, isNewsProviderEnabled } from '../newsService';
import { Headline } from '../providers/newsProvider';
import { NewsState } from '../../../lib/types';
import { FEATURED_NEWS_STORY, SECONDARY_NEWS_STORIES } from '../../../mocks/ambientData';
import { GdeltProviderError } from '../providers/gdeltProvider';

const NEWS_CACHE_POLICY = {
  freshForMs: 10 * 60 * 1000,
  staleForMs: 6 * 60 * 60 * 1000,
};
const NEWS_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export function useNews() {
  const { settings } = useSettingsStore();
  const { newsStatus: devNewsStatus } = useDevStateStore();

  const [newsState, setNewsState] = useState<NewsState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const categoriesKey = [...settings.newsCategories].sort().join(',');
  // v3 invalidates results produced by the previous unbounded "news OR breaking"
  // query so they cannot masquerade as a successful refresh from this provider.
  const cacheKey = `news_gdelt_v3_${categoriesKey}`;
  const isDemoMode = import.meta.env.DEV && settings.isDemoMode;

  const loadNews = useCallback(
    async (forceRefresh = false) => {
      // 1. Dev state overrides
      if (import.meta.env.DEV && devNewsStatus === 'loading') {
        setNewsState({ status: 'loading' });
        return;
      }
      if (import.meta.env.DEV && devNewsStatus === 'empty') {
        setNewsState({ status: 'empty' });
        return;
      }
      if (import.meta.env.DEV && devNewsStatus === 'error') {
        setNewsState({ status: 'error', errorMessage: 'News is temporarily unavailable' });
        return;
      }
      if (import.meta.env.DEV && devNewsStatus === 'cached') {
        setNewsState({
          status: 'cached',
          featured: FEATURED_NEWS_STORY,
          secondary: SECONDARY_NEWS_STORIES,
          lastUpdatedText: 'Showing cached stories · Last updated 20 minutes ago',
        });
        return;
      }

      // 2. Check local cache first (20 min TTL)
      const cachedRecord = cacheService.getCache<Headline[]>(cacheKey);

      // Live GDELT stays disabled until an actual request succeeds in the
      // deployed GitHub Pages page context. Never present a legacy cache as live.
      if (!isNewsProviderEnabled()) {
        if (cachedRecord && cachedRecord.data.length > 0) {
          setNewsState({
            status: 'cached',
            featured: cachedRecord.data[0],
            secondary: cachedRecord.data.slice(1),
            lastUpdatedText: `Live news unavailable · Showing saved stories · Updated ${getRelativeTimeString(cachedRecord.fetchedAt)}`,
          });
        } else {
          setNewsState({
            status: 'error',
            errorMessage:
              'Live news is unavailable because deployed-site browser verification has not passed.',
          });
        }
        setIsRefreshing(false);
        return;
      }

      if (cachedRecord && !cachedRecord.isStale && !forceRefresh) {
        if (cachedRecord.data.length > 0) {
          setNewsState({
            status: 'loaded',
            featured: cachedRecord.data[0],
            secondary: cachedRecord.data.slice(1),
          });
        } else {
          setNewsState({ status: 'empty' });
        }
        return;
      }

      // If stale cache or background revalidation needed, show cached items immediately and refresh in background
      if (cachedRecord && !forceRefresh) {
        if (cachedRecord.data.length > 0) {
          setNewsState({
            status: 'cached',
            featured: cachedRecord.data[0],
            secondary: cachedRecord.data.slice(1),
            lastUpdatedText: `Showing cached stories · Updated ${getRelativeTimeString(cachedRecord.fetchedAt)}`,
          });
        }
      } else if (!cachedRecord) {
        setNewsState({ status: 'loading' });
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Slow or stop refreshes while hidden
        if (typeof document !== 'undefined' && document.hidden && cachedRecord) {
          return;
        }

        const liveHeadlines = await fetchNewsHeadlines(
          settings.newsCategories,
          controller.signal
        );

        if (!controller.signal.aborted) {
          if (liveHeadlines.length > 0) {
            cacheService.setCache(cacheKey, liveHeadlines, NEWS_CACHE_POLICY);
            setNewsState({
              status: 'loaded',
              featured: liveHeadlines[0],
              secondary: liveHeadlines.slice(1),
            });
          } else {
            setNewsState({ status: 'empty' });
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Preserve cached stories on failure
        const fallbackCache = cacheService.getCache<Headline[]>(cacheKey);
        if (fallbackCache && fallbackCache.data.length > 0) {
          setNewsState({
            status: 'cached',
            featured: fallbackCache.data[0],
            secondary: fallbackCache.data.slice(1),
            lastUpdatedText: `Showing saved stories · ${getFailureLabel(error)} · Updated ${getRelativeTimeString(fallbackCache.fetchedAt)}`,
          });
        } else {
          if (isDemoMode) {
            setNewsState({
              status: 'loaded',
              featured: FEATURED_NEWS_STORY,
              secondary: SECONDARY_NEWS_STORIES,
            });
          } else {
            setNewsState({
              status: 'error',
              errorMessage: `${getFailureLabel(error)}. No saved stories are available.`,
            });
          }
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [settings.newsCategories, isDemoMode, devNewsStatus, cacheKey]
  );

  useEffect(() => {
    loadNews();

    const refreshInterval = window.setInterval(() => {
      if (!document.hidden) void loadNews(true);
    }, NEWS_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshInterval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadNews]);

  const refreshNews = useCallback(() => {
    setIsRefreshing(true);
    loadNews(true);
  }, [loadNews]);

  return {
    newsState,
    isRefreshing,
    refreshNews,
  };
}

function getFailureLabel(error: unknown): string {
  if (error instanceof GdeltProviderError) {
    if (error.kind === 'rate-limited') return 'GDELT rate limited the refresh';
    if (error.kind === 'timeout') return 'GDELT refresh timed out';
    if (error.kind === 'network') return 'The browser could not read the GDELT response';
    if (error.kind === 'invalid-response') return 'GDELT returned invalid data';
    return 'GDELT refresh failed';
  }
  return 'Connection failed';
}

function getRelativeTimeString(isoString: string): string {
  try {
    const fetched = new Date(isoString).getTime();
    const diffMs = Date.now() - fetched;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'recently';
  }
}
