import { describe, expect, it } from 'vitest';
import { GeneratedNewsFeedSchema } from '../generatedFeedSchemas';
import { NEWS_CATEGORIES } from '../model';

export const TEST_HEADLINE = {
  id: 'currents-test',
  title: 'A useful test headline',
  publisher: 'Example',
  publisherDomain: 'example.com',
  publishedAt: '2026-08-02T12:00:00.000Z',
  url: 'https://example.com/story',
  categories: ['Top' as const],
};

export function makeTestFeed(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    provider: 'currents',
    generatedAt: '2026-08-02T12:30:00.000Z',
    sourceFetchedAt: '2026-08-02T12:30:00.000Z',
    status: 'success',
    categories: Object.fromEntries(NEWS_CATEGORIES.map((category) => [category, category === 'Top' ? [TEST_HEADLINE] : []])),
    metadata: {
      requestCount: 5,
      successfulRequests: 5,
      failedRequests: 0,
      articleCountBeforeDeduplication: 1,
      articleCountAfterDeduplication: 1,
    },
    ...overrides,
  };
}

describe('GeneratedNewsFeedSchema', () => {
  it('validates the complete versioned document', () => {
    expect(GeneratedNewsFeedSchema.parse(makeTestFeed()).schemaVersion).toBe(1);
  });

  it('rejects unsafe URLs and inconsistent request metadata', () => {
    const unsafe = makeTestFeed({
      categories: Object.fromEntries(NEWS_CATEGORIES.map((category) => [category, category === 'Top' ? [{ ...TEST_HEADLINE, url: 'javascript:alert(1)' }] : []])),
    });
    expect(() => GeneratedNewsFeedSchema.parse(unsafe)).toThrow();
    expect(() => GeneratedNewsFeedSchema.parse(makeTestFeed({
      metadata: { requestCount: 5, successfulRequests: 4, failedRequests: 0, articleCountBeforeDeduplication: 1, articleCountAfterDeduplication: 1 },
    }))).toThrow();
  });
});
