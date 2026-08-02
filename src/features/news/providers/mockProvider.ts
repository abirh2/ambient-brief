import { NewsCategory } from '../../../lib/types';
import { NewsProvider, Headline } from './newsProvider';
import { FEATURED_NEWS_STORY, SECONDARY_NEWS_STORIES } from '../../../mocks/ambientData';

export class MockNewsProvider implements NewsProvider {
  id = 'mock';
  displayName = 'Ambient Mock News';

  supportsCategory(_category: NewsCategory): boolean {
    return true;
  }

  async fetchHeadlines(_categories: NewsCategory[]): Promise<Headline[]> {
    const all = [FEATURED_NEWS_STORY, ...SECONDARY_NEWS_STORIES];
    return all.map((art) => ({
      ...art,
      publisherDomain: 'mocknews.com',
    }));
  }
}

export const mockProvider = new MockNewsProvider();
