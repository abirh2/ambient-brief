import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeTestFeed } from '../../__tests__/generatedFeedSchemas.test';
import { resolveNewsFeedUrl, StaticNewsProvider } from '../staticNewsProvider';

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

  it('rejects invalid static JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ provider: 'currents' }), { status: 200 })));
    await expect(new StaticNewsProvider().fetchHeadlines(['Top'])).rejects.toThrow();
  });
});
