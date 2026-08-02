import { NewsCategory, NewsArticle } from '../../../lib/types';

export interface Headline extends NewsArticle {
  publisherDomain: string;
  url?: string;
  rankingScore?: number;
  rankingReason?: string;
}

export interface NewsProvider {
  id: string;
  displayName: string;
  supportsCategory(category: NewsCategory): boolean;
  fetchHeadlines(
    categories: NewsCategory[],
    signal?: AbortSignal
  ): Promise<Headline[]>;
}
