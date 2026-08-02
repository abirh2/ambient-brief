import { describe, expect, it } from 'vitest';
import { buildGdeltArticleListUrl, normalizeGdeltResponse } from '../gdeltProvider';

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

  it('builds a bounded recent English article-list request without generic news terms', () => {
    const url = new URL(buildGdeltArticleListUrl(['Top', 'U.S.', 'Technology', 'World']));

    expect(url.origin).toBe('https://api.gdeltproject.org');
    expect(url.searchParams.get('mode')).toBe('artlist');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('timespan')).toBe('24h');
    expect(url.searchParams.get('maxrecords')).toBe('35');
    expect(url.searchParams.get('query')).toContain('sourcelang:english');
    expect(url.searchParams.get('query')).not.toContain('world');
    expect(url.searchParams.get('query')).not.toMatch(/\bnews\b/);
  });

  it('drops articles with missing or malformed timestamps', () => {
    const result = normalizeGdeltResponse({ articles: [{
      title: 'Technology investment expands',
      url: 'https://example.com/story',
      domain: 'example.com',
      seendate: 'not-a-date',
    }] }, ['Technology']);

    expect(result).toEqual([]);
  });
});
