import { NewsCategory } from '../../../lib/types';
import { NewsProvider, Headline } from './newsProvider';
import { fetchNewsArticles } from '../newsService';

export class GuardianNewsProvider implements NewsProvider {
  id = 'guardian';
  displayName = 'The Guardian';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  supportsCategory(_category: NewsCategory): boolean {
    return true;
  }

  async fetchHeadlines(categories: NewsCategory[]): Promise<Headline[]> {
    const articles = await fetchNewsArticles(categories, this.apiKey);
    return articles.map((art) => ({
      ...art,
      publisherDomain: 'theguardian.com',
    }));
  }
}
