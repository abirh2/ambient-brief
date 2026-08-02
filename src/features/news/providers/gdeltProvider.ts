import { NewsCategory } from '../../../lib/types';
import { NewsProvider, Headline } from './newsProvider';
import { deduplicateHeadlines } from '../utils/deduplication';
import { rankHeadlines } from '../utils/ranking';
import { GdeltResponseSchema, type GdeltArticleResponse } from './gdeltSchemas';

const DEFAULT_CATEGORIES: NewsCategory[] = ['Top', 'U.S.', 'Technology'];
const REQUEST_TIMEOUT_MS = 15_000;

const CATEGORY_QUERY_TERMS: Record<NewsCategory, readonly string[]> = {
  'Top': ['election', 'government', 'economy', 'conflict', 'disaster', 'diplomacy'],
  'U.S.': ['"white house"', 'congress', 'federal', '"supreme court"', '"united states"'],
  'World': ['international', 'diplomacy', 'conflict', 'geopolitics', 'humanitarian'],
  'Business': ['business', 'economy', 'markets', 'finance', 'trade'],
  'Technology': ['technology', 'software', 'cybersecurity', '"artificial intelligence"'],
  'Science': ['science', 'space', 'research', 'climate', 'discovery'],
  'Sports': ['sports', 'football', 'basketball', 'soccer', 'baseball'],
  'Entertainment': ['entertainment', 'movies', 'television', 'music', 'arts'],
};

export type GdeltFailureKind =
  | 'rate-limited'
  | 'timeout'
  | 'network'
  | 'http'
  | 'invalid-response';

export class GdeltProviderError extends Error {
  constructor(
    public readonly kind: GdeltFailureKind,
    message: string,
  ) {
    super(message);
    this.name = 'GdeltProviderError';
  }
}

function normalizeCategories(categories: NewsCategory[]): NewsCategory[] {
  const selected = [...new Set(categories)].slice(0, 3);
  return selected.length > 0 ? selected : DEFAULT_CATEGORIES;
}

export function buildGdeltArticleListUrl(categories: NewsCategory[]): string {
  const targetCategories = normalizeCategories(categories);
  const terms = [...new Set(targetCategories.flatMap((category) => CATEGORY_QUERY_TERMS[category]))];
  const params = new URLSearchParams({
    query: `(${terms.join(' OR ')}) sourcelang:english`,
    mode: 'artlist',
    format: 'json',
    maxrecords: '35',
    timespan: '24h',
    sort: 'datedesc',
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseSeenDate(seenDate?: string): string | undefined {
  if (!seenDate || !/^\d{8}T\d{6}Z$/.test(seenDate)) return undefined;
  const year = seenDate.slice(0, 4);
  const month = seenDate.slice(4, 6);
  const day = seenDate.slice(6, 8);
  const hour = seenDate.slice(9, 11);
  const minute = seenDate.slice(11, 13);
  const second = seenDate.slice(13, 15);
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function categoryFor(article: GdeltArticleResponse, categories: NewsCategory[]): NewsCategory {
  const lowerTitle = article.title.toLowerCase();
  return categories.find((category) =>
    CATEGORY_QUERY_TERMS[category].some((keyword) =>
      lowerTitle.includes(keyword.replaceAll('"', '').toLowerCase())
    )
  ) ?? categories[0] ?? 'Top';
}

/** Converts a validated provider payload into the application news model. */
export function normalizeGdeltResponse(payload: unknown, categories: NewsCategory[]): Headline[] {
  const response = GdeltResponseSchema.parse(payload);
  const targetCategories = normalizeCategories(categories);
  const articles = response.articles ?? response.data ?? [];

  const headlines = articles.flatMap((article, index): Headline[] => {
    const publishedAt = parseSeenDate(article.seendate);
    if (!isValidHttpUrl(article.url) || !publishedAt) return [];
    return [{
      id: `gdelt-${index}-${article.seendate ?? 'undated'}`,
      title: article.title,
      summary: '',
      category: categoryFor(article, targetCategories),
      source: article.domain || 'GDELT Wire',
      publisherDomain: article.domain,
      publishedAt,
      url: article.url,
      imageUrl:
        article.socialimage && isValidHttpUrl(article.socialimage) && article.socialimage.startsWith('https://')
          ? article.socialimage
          : undefined,
    }];
  });

  return rankHeadlines(deduplicateHeadlines(headlines), targetCategories);
}

export class GdeltNewsProvider implements NewsProvider {
  id = 'gdelt';
  displayName = 'GDELT Live News';

  supportsCategory(_category: NewsCategory): boolean {
    return true;
  }

  async fetchHeadlines(
    categories: NewsCategory[],
    signal?: AbortSignal
  ): Promise<Headline[]> {
    const targetCategories = normalizeCategories(categories);
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', forwardAbort, { once: true });
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(buildGdeltArticleListUrl(targetCategories), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (res.status === 429) {
        throw new GdeltProviderError('rate-limited', 'GDELT is temporarily rate limiting requests.');
      }
      if (!res.ok) {
        throw new GdeltProviderError('http', `GDELT returned HTTP ${res.status}.`);
      }

      try {
        return normalizeGdeltResponse(await res.json(), targetCategories);
      } catch (error) {
        if (error instanceof GdeltProviderError) throw error;
        throw new GdeltProviderError('invalid-response', 'GDELT returned an invalid article payload.');
      }
    } catch (error) {
      if (timedOut) {
        throw new GdeltProviderError('timeout', 'GDELT did not respond within 15 seconds.');
      }
      if (error instanceof TypeError) {
        throw new GdeltProviderError(
          'network',
          'The browser could not read the GDELT response.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', forwardAbort);
    }
  }
}

export const gdeltProvider = new GdeltNewsProvider();
