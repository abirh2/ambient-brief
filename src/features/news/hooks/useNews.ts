import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { cacheService } from '../../../lib/api/cacheService';
import { fetchNewsHeadlines } from '../newsService';
import { Headline } from '../providers/newsProvider';
import { NewsState } from '../../../lib/types';
import { FEATURED_NEWS_STORY, SECONDARY_NEWS_STORIES } from '../../../mocks/ambientData';

const NEWS_CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes cache per instructions

export function useNews() {
  const { settings } = useSettingsStore();
  const { newsStatus: devNewsStatus } = useDevStateStore();

  const [newsState, setNewsState] = useState<NewsState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const categoriesKey = [...settings.newsCategories].sort().join(',');
  const cacheKey = `news_gdelt_v2_${categoriesKey}_${settings.guardianApiKey || 'none'}`;

  const loadNews = useCallback(
    async (forceRefresh = false) => {
      // 1. Dev state overrides
      if (devNewsStatus === 'loading') {
        setNewsState({ status: 'loading' });
        return;
      }
      if (devNewsStatus === 'empty') {
        setNewsState({ status: 'empty' });
        return;
      }
      if (devNewsStatus === 'error') {
        setNewsState({ status: 'error', errorMessage: 'News is temporarily unavailable' });
        return;
      }
      if (devNewsStatus === 'cached') {
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
          settings.guardianApiKey,
          controller.signal
        );

        if (!controller.signal.aborted) {
          if (liveHeadlines.length > 0) {
            cacheService.setCache(cacheKey, liveHeadlines, NEWS_CACHE_TTL_MS);
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
            lastUpdatedText: `Showing cached stories · Connection failed · Updated ${getRelativeTimeString(fallbackCache.fetchedAt)}`,
          });
        } else {
          if (settings.isDemoMode) {
            setNewsState({
              status: 'loaded',
              featured: FEATURED_NEWS_STORY,
              secondary: SECONDARY_NEWS_STORIES,
            });
          } else {
            setNewsState({
              status: 'error',
              errorMessage: 'Unable to fetch news headlines. No cached stories available.',
            });
          }
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [settings.newsCategories, settings.guardianApiKey, settings.isDemoMode, devNewsStatus, cacheKey]
  );

  useEffect(() => {
    loadNews();

    return () => {
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
