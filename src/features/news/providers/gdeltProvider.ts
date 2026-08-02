import { NewsCategory } from '../../../lib/types';
import { NewsProvider, Headline } from './newsProvider';
import { deduplicateHeadlines } from '../utils/deduplication';
import { rankHeadlines } from '../utils/ranking';

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

    const data = await res.json();
    const rawArticles = data.articles || data.data || [];

    if (!Array.isArray(rawArticles) || rawArticles.length === 0) {
      return [];
    }

    const headlines: Headline[] = [];

    for (let i = 0; i < rawArticles.length; i++) {
      const item = rawArticles[i];
      const title = item.title;
      const articleUrl = item.url;
      const domain = item.domain || '';
      const seendate = item.seendate;
      const socialimage = item.socialimage;

      if (!title || !isValidHttpUrl(articleUrl)) {
        continue;
      }

      let publishedAt = new Date().toISOString();
      if (seendate && seendate.length >= 15) {
        try {
          const y = seendate.slice(0, 4);
          const m = seendate.slice(4, 6);
          const d = seendate.slice(6, 8);
          const h = seendate.slice(9, 11);
          const min = seendate.slice(11, 13);
          const s = seendate.slice(13, 15);
          publishedAt = new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).toISOString();
        } catch {
          // fallback
        }
      }

      let assignedCategory: NewsCategory = targetCategories[0] || 'Top';
      const lowerTitle = title.toLowerCase();
      for (const cat of targetCategories) {
        const queryStr = CATEGORY_QUERY_MAP[cat as NewsCategory] || '';
        const keywords = queryStr.toLowerCase().split(' or ');
        if (keywords.some((kw: string) => lowerTitle.includes(kw.trim()))) {
          assignedCategory = cat as NewsCategory;
          break;
        }
      }

      const imageUrl = isValidHttpUrl(socialimage) ? socialimage : undefined;

      headlines.push({
        id: `gdelt-${i}-${Date.now()}`,
        title,
        summary: '',
        category: assignedCategory,
        source: domain || 'GDELT Wire',
        publisherDomain: domain,
        publishedAt,
        url: articleUrl,
        imageUrl,
      });
    }

    const deduped = deduplicateHeadlines(headlines);
    const ranked = rankHeadlines(deduped, targetCategories);

    return ranked;
  }
}

export const gdeltProvider = new GdeltNewsProvider();
