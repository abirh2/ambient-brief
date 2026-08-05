import { useCallback, useState } from 'react';
import { cacheService } from '../../../lib/api/cacheService';
import { useDevStateStore } from '../../../lib/stores/useDevStateStore';
import { useSettingsStore } from '../../../lib/stores/useSettingsStore';
import { FEATURED_NEWS_STORY, SECONDARY_NEWS_STORIES } from '../../../mocks/ambientData';
import { GeneratedNewsFeedSchema } from '../generatedFeedSchemas';
import type { GeneratedNewsFeed, NewsCategory, NewsState } from '../model';
import { fetchNewsHeadlines } from '../newsService';
import { selectFeedHeadlines } from '../providers/staticNewsProvider';

const NEWS_CACHE_POLICY = {
  freshForMs: 25 * 60 * 1_000,
  staleForMs: 24 * 60 * 60 * 1_000,
};
export const GENERATED_FEED_STALE_AFTER_MS = 75 * 60 * 1_000;

function getRelativeTimeString(isoString: string, now = Date.now()): string {
  const fetched = Date.parse(isoString);
  if (Number.isNaN(fetched)) return 'recently';
  const diffMins = Math.max(0, Math.floor((now - fetched) / 60_000));
  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(fetched));
}

export function isGeneratedFeedStale(feed: GeneratedNewsFeed, now = Date.now()): boolean {
  return now - Date.parse(feed.generatedAt) > GENERATED_FEED_STALE_AFTER_MS;
}

export function stateFromFeed(
  feed: GeneratedNewsFeed,
  categories: NewsCategory[],
  source: 'static' | 'cache',
  now = Date.now(),
): NewsState {
  const headlines = selectFeedHeadlines(categories, feed);
  if (headlines.length === 0) return { status: 'empty' };
  const ageText = getRelativeTimeString(feed.generatedAt, now);
  const delayed = isGeneratedFeedStale(feed, now) || feed.status === 'partial';
  const content = { featured: headlines[0], secondary: headlines.slice(1) };
  if (source === 'cache') {
    return { status: 'cached', ...content, updatedText: `Showing cached stories · Updated ${ageText}` };
  }
  if (delayed) {
    return { status: 'cached', ...content, updatedText: `News update delayed · Updated ${ageText}` };
  }
  return { status: 'loaded', ...content, updatedText: `Updated ${ageText}` };
}

interface ResolveNewsOptions {
  categories: NewsCategory[];
  cachedFeed?: GeneratedNewsFeed;
  load: () => Promise<{ feed: GeneratedNewsFeed }>;
  now?: number;
}

export async function resolveNewsLoad(options: ResolveNewsOptions): Promise<{
  state: NewsState;
  validatedFeed?: GeneratedNewsFeed;
}> {
  try {
    const result = await options.load();
    return {
      state: stateFromFeed(result.feed, options.categories, 'static', options.now),
      validatedFeed: result.feed,
    };
  } catch {
    if (options.cachedFeed) {
      const cachedState = stateFromFeed(options.cachedFeed, options.categories, 'cache', options.now);
      if (cachedState.status === 'cached') {
        return {
          state: { ...cachedState, updatedText: `Showing cached stories · News update delayed · ${cachedState.updatedText.split(' · ').at(-1)}` },
        };
      }
      return { state: cachedState };
    }
    return { state: { status: 'error', errorMessage: 'News temporarily unavailable' } };
  }
}

export function useNews() {
  const { settings } = useSettingsStore();
  const { newsStatus: devNewsStatus } = useDevStateStore();
  const categoriesKey = [...settings.newsCategories].sort().join(',');
  const cacheKey = `news_currents_static_v1_${categoriesKey}`;
  const [newsState, setNewsState] = useState<NewsState>(() => {
    const cached = cacheService.getCache<GeneratedNewsFeed>(cacheKey);
    const parsed = cached ? GeneratedNewsFeedSchema.safeParse(cached.data) : undefined;
    return parsed?.success ? stateFromFeed(parsed.data, settings.newsCategories, 'cache') : { status: 'loading' };
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNews = useCallback(async (forceRefresh = false, signal?: AbortSignal): Promise<'success' | 'cached' | 'skipped'> => {
    if (import.meta.env.DEV && devNewsStatus !== 'loaded') {
      if (devNewsStatus === 'loading') setNewsState({ status: 'loading' });
      if (devNewsStatus === 'empty') setNewsState({ status: 'empty' });
      if (devNewsStatus === 'error') setNewsState({ status: 'error', errorMessage: 'News temporarily unavailable' });
      if (devNewsStatus === 'cached') setNewsState({
        status: 'cached',
        featured: FEATURED_NEWS_STORY,
        secondary: SECONDARY_NEWS_STORIES,
        updatedText: 'Showing cached stories · Updated 20 minutes ago',
      });
      setIsRefreshing(false);
      return 'skipped';
    }

    const unvalidatedCache = cacheService.getCache<GeneratedNewsFeed>(cacheKey);
    const cachedResult = unvalidatedCache
      ? GeneratedNewsFeedSchema.safeParse(unvalidatedCache.data)
      : undefined;
    const cachedRecord = unvalidatedCache && cachedResult?.success
      ? { ...unvalidatedCache, data: cachedResult.data }
      : undefined;
    if (unvalidatedCache && !cachedRecord) cacheService.clearKey(cacheKey);
    if (cachedRecord && !forceRefresh) {
      setNewsState(stateFromFeed(cachedRecord.data, settings.newsCategories, 'cache'));
    } else if (!cachedRecord) {
      setNewsState({ status: 'loading' });
    }

    const resolved = await resolveNewsLoad({
      categories: settings.newsCategories,
      cachedFeed: cachedRecord?.data,
      load: async () => fetchNewsHeadlines(settings.newsCategories, signal),
    });
    if (!signal?.aborted) {
      if (resolved.validatedFeed) cacheService.setCache(cacheKey, resolved.validatedFeed, NEWS_CACHE_POLICY);
      setNewsState(resolved.state);
    }
    setIsRefreshing(false);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!resolved.validatedFeed) {
      if (cachedRecord) return 'cached';
      throw new Error('News temporarily unavailable');
    }
    return resolved.state.status === 'cached' ? 'cached' : 'success';
  }, [cacheKey, devNewsStatus, settings.newsCategories]);

  const refreshNews = useCallback((signal?: AbortSignal) => {
    setIsRefreshing(true);
    return loadNews(true, signal);
  }, [loadNews]);

  const isNewsStale = useCallback(() => {
    const cached = cacheService.getCache<GeneratedNewsFeed>(cacheKey);
    const validated = cached ? GeneratedNewsFeedSchema.safeParse(cached.data) : undefined;
    return !cached || !validated?.success || cached.isStale || isGeneratedFeedStale(validated.data);
  }, [cacheKey]);

  return { newsState, isRefreshing, refreshNews, loadNews, isNewsStale };
}
