import { describe, expect, it } from 'vitest';
import { GeneratedNewsFeedSchema } from '../../generatedFeedSchemas';
import { isGeneratedFeedStale, resolveNewsLoad, stateFromFeed } from '../useNews';
import { makeTestFeed } from '../../__tests__/generatedFeedSchemas.test';

describe('static news frontend fallback', () => {
  const feed = GeneratedNewsFeedSchema.parse(makeTestFeed());

  it('preserves cached stories when the static fetch fails', async () => {
    const result = await resolveNewsLoad({ categories: ['Top'], cachedFeed: feed, load: async () => { throw new Error('offline'); } });
    expect(result.state.status).toBe('cached');
    if (result.state.status === 'cached') expect(result.state.updatedText).toContain('Showing cached stories');
  });

  it('labels a stale generated feed as delayed', () => {
    const now = Date.parse(feed.generatedAt) + 76 * 60_000;
    expect(isGeneratedFeedStale(feed, now)).toBe(true);
    const state = stateFromFeed(feed, ['Top'], 'static', now);
    expect(state.status).toBe('cached');
    if (state.status === 'cached') expect(state.updatedText).toContain('News update delayed');
  });

  it('shows unavailable when neither generated output nor browser cache exists', async () => {
    const result = await resolveNewsLoad({ categories: ['Top'], load: async () => { throw new Error('missing'); } });
    expect(result.state).toEqual({ status: 'error', errorMessage: 'News temporarily unavailable' });
  });
});
