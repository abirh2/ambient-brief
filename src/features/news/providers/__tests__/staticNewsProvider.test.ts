import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeTestFeed, TEST_HEADLINE } from '../../__tests__/generatedFeedSchemas.test';
import type { NewsCategory } from '../../model';
import { resolveNewsFeedUrl, StaticNewsProvider } from '../staticNewsProvider';

function categoryHeadline(category: NewsCategory, index: number) {
  const slug = category.toLowerCase().replace(/[^a-z]+/g, '-');
  const marker = `story${String.fromCharCode(97 + index)}marker`;
  return {
    ...TEST_HEADLINE,
    id: `${slug}-${index}`,
    title: `${category} ${marker} distinct coverage update`,
    publisherDomain: `${slug}.example.com`,
    url: `https://${slug}.example.com/${index}`,
    categories: [category],
  };
}

describe('StaticNewsProvider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves the feed beneath a GitHub Pages project base path', () => {
    expect(resolveNewsFeedUrl('/ambient-brief/')).toBe('/ambient-brief/data/news-feed.json');
    expect(resolveNewsFeedUrl('/')).toBe('/data/news-feed.json');
  });

  it('validates the generated document before returning headlines', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(makeTestFeed()), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new StaticNewsProvider().fetchHeadlines(['Top']);
    expect(result.headlines).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('data/news-feed.json'), expect.objectContaining({ cache: 'no-cache' }));
  });

  it('retains sparse categories when other selected categories contain full feeds', async () => {
    const categories: Record<NewsCategory, ReturnType<typeof categoryHeadline>[]> = {
      Top: Array.from({ length: 16 }, (_, index) => categoryHeadline('Top', index)),
      'U.S.': Array.from({ length: 16 }, (_, index) => categoryHeadline('U.S.', index)),
      World: [],
      Business: [],
      Technology: Array.from({ length: 2 }, (_, index) => categoryHeadline('Technology', index)),
      Science: [],
      Sports: [],
      Entertainment: [],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(makeTestFeed({ categories })), { status: 200 })));

    const result = await new StaticNewsProvider().fetchHeadlines(['Top', 'U.S.', 'Technology']);

    expect(result.headlines.filter((headline) => headline.categories.includes('Technology'))).toHaveLength(2);
    expect(result.headlines).toHaveLength(34);
  });

  it('rejects invalid static JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ provider: 'currents' }), { status: 200 })));
    await expect(new StaticNewsProvider().fetchHeadlines(['Top'])).rejects.toThrow();
  });
});
