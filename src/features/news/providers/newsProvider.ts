import { NewsCategory, NewsArticle } from '../../../lib/types';

export type Headline = NewsArticle;

export interface NewsProvider {
  id: string;
  displayName: string;
  supportsCategory(category: NewsCategory): boolean;
  fetchHeadlines(
    categories: NewsCategory[],
    signal?: AbortSignal
  ): Promise<Headline[]>;
}
