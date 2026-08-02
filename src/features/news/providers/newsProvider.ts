import type { GeneratedNewsFeed, Headline, NewsCategory } from '../model';

export type { Headline } from '../model';

export interface NewsProvider {
  id: string;
  displayName: string;
  supportsCategory(category: NewsCategory): boolean;
  fetchHeadlines(
    categories: NewsCategory[],
    signal?: AbortSignal
  ): Promise<{ feed: GeneratedNewsFeed; headlines: Headline[] }>;
}
