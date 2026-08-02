import { GeneratedNewsFeedSchema } from '../generatedFeedSchemas';
import { NEWS_CATEGORIES, type Headline, type NewsCategory } from '../model';
import { deduplicateHeadlines } from '../utils/deduplication';
import type { NewsProvider } from './newsProvider';

export const STATIC_NEWS_FEED_PATH = 'data/news-feed.json';

export function resolveNewsFeedUrl(baseUrl = import.meta.env.BASE_URL): string {
  const normalizedBase = baseUrl === '/' ? '/' : `/${baseUrl.replace(/^\/+|\/+$/g, '')}/`;
  return `${normalizedBase}${STATIC_NEWS_FEED_PATH}`;
}

export function selectFeedHeadlines(
  categories: NewsCategory[],
  feed: ReturnType<typeof GeneratedNewsFeedSchema.parse>,
): Headline[] {
  const selected = categories.length > 0 ? [...new Set(categories)] : ['Top' as const];
  const queues = selected.map((category) => feed.categories[category]);
  const interleaved: Headline[] = [];
  const maxLength = Math.max(0, ...queues.map((queue) => queue.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const queue of queues) {
      const headline = queue[index];
      if (headline) interleaved.push(headline);
    }
  }
  // Keep the complete union of the selected category buckets. Truncating the
  // combined list here can remove every story from a smaller category after
  // deduplication re-sorts by metadata completeness. The panel applies the
  // active-category filter before deciding how many stories to show.
  return deduplicateHeadlines(interleaved);
}

export class StaticNewsProvider implements NewsProvider {
  readonly id = 'currents-static';
  readonly displayName = 'Currents static news feed';

  supportsCategory(category: NewsCategory): boolean {
    return NEWS_CATEGORIES.includes(category);
  }

  async fetchHeadlines(categories: NewsCategory[], signal?: AbortSignal) {
    const response = await fetch(resolveNewsFeedUrl(), {
      signal,
      headers: { Accept: 'application/json' },
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error('Static news feed is unavailable');
    const feed = GeneratedNewsFeedSchema.parse(await response.json());
    return { feed, headlines: selectFeedHeadlines(categories, feed) };
  }
}

export const staticNewsProvider = new StaticNewsProvider();
