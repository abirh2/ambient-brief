import { NewsCategory } from '../../../lib/types';
import { NewsProvider, Headline } from './newsProvider';
import { deduplicateHeadlines } from '../utils/deduplication';
import { rankHeadlines } from '../utils/ranking';
import { GdeltResponseSchema, type GdeltArticleResponse } from './gdeltSchemas';

const CATEGORY_QUERY_MAP: Record<NewsCategory, string> = {
  'Top': 'news OR breaking',
  'U.S.': 'united states OR us news OR domestic',
  'World': 'international OR world news OR global',
  'Business': 'business OR economy OR markets OR finance',
  'Technology': 'technology OR tech OR software OR ai',
  'Science': 'science OR space OR research OR climate',
  'Sports': 'sports OR football OR basketball OR soccer',
  'Entertainment': 'entertainment OR movies OR music OR arts',
};

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseSeenDate(seenDate?: string): string {
  if (!seenDate || seenDate.length < 15) return new Date(0).toISOString();
  const year = seenDate.slice(0, 4);
  const month = seenDate.slice(4, 6);
  const day = seenDate.slice(6, 8);
  const hour = seenDate.slice(9, 11);
  const minute = seenDate.slice(11, 13);
  const second = seenDate.slice(13, 15);
  const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function categoryFor(article: GdeltArticleResponse, categories: NewsCategory[]): NewsCategory {
  const lowerTitle = article.title.toLowerCase();
  return categories.find((category) =>
    CATEGORY_QUERY_MAP[category]
      .toLowerCase()
      .split(' or ')
      .some((keyword) => lowerTitle.includes(keyword.trim()))
  ) ?? categories[0] ?? 'Top';
}

/** Converts a validated provider payload into the application news model. */
export function normalizeGdeltResponse(payload: unknown, categories: NewsCategory[]): Headline[] {
  const response = GdeltResponseSchema.parse(payload);
  const targetCategories: NewsCategory[] = categories.length > 0 ? categories : ['Top', 'U.S.', 'Technology'];
  const articles = response.articles ?? response.data ?? [];

  const headlines = articles.flatMap((article, index): Headline[] => {
    if (!isValidHttpUrl(article.url)) return [];
    return [{
      id: `gdelt-${index}-${article.seendate ?? 'undated'}`,
      title: article.title,
      summary: '',
      category: categoryFor(article, targetCategories),
      source: article.domain || 'GDELT Wire',
      publisherDomain: article.domain,
      publishedAt: parseSeenDate(article.seendate),
      url: article.url,
      imageUrl: article.socialimage && isValidHttpUrl(article.socialimage) ? article.socialimage : undefined,
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
    const targetCategories: NewsCategory[] = categories && categories.length > 0 ? categories : ['Top', 'U.S.', 'Technology'];
    
    const queryTerms = targetCategories
      .map((cat: NewsCategory) => CATEGORY_QUERY_MAP[cat] || 'news')
      .join(' OR ');

    const encodedQuery = encodeURIComponent(`(${queryTerms}) sourcelang:english`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodedQuery}&mode=artlist&format=json&maxrecords=50&sort=datedesc`;

    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`GDELT API error: HTTP ${res.status} ${res.statusText}`);
    }

    return normalizeGdeltResponse(await res.json(), targetCategories);
  }
}

export const gdeltProvider = new GdeltNewsProvider();
