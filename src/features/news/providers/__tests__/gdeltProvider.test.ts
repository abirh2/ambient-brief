import { describe, expect, it } from 'vitest';
import { normalizeGdeltResponse } from '../gdeltProvider';

describe('normalizeGdeltResponse', () => {
  it('maps validated provider articles to stable application headlines', () => {
    const result = normalizeGdeltResponse({ articles: [{
      title: 'Technology investment expands',
      url: 'https://example.com/story',
      domain: 'example.com',
      seendate: '20260802T170409Z',
    }] }, ['Technology']);

    expect(result[0]).toMatchObject({
      id: 'gdelt-0-20260802T170409Z',
      category: 'Technology',
      source: 'example.com',
      publishedAt: '2026-08-02T17:04:09.000Z',
    });
  });

  it('rejects malformed provider payloads', () => {
    expect(() => normalizeGdeltResponse({ articles: [{ title: 42 }] }, ['Top'])).toThrow();
  });
});
