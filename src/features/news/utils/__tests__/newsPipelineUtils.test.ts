import { describe, expect, it } from 'vitest';
import type { Headline } from '../../model';
import { deduplicateHeadlines } from '../deduplication';
import { rankHeadlines } from '../ranking';
import { formatPublisherName } from '../sourceMapper';

function headline(id: string, publisherDomain: string, title = `Government policy update number ${id}`): Headline {
  return {
    id,
    title,
    publisher: formatPublisherName(publisherDomain),
    publisherDomain,
    publishedAt: '2026-08-02T12:00:00.000Z',
    url: `https://${publisherDomain}/${id}`,
    categories: ['Top', 'World'],
  };
}

describe('news pipeline utilities', () => {
  it('derives readable source names', () => {
    expect(formatPublisherName('www.bbc.co.uk')).toBe('BBC News');
    expect(formatPublisherName('daily-example.com')).toBe('Daily Example');
  });

  it('deduplicates canonical URLs, normalized titles, and conservative same-domain coverage', () => {
    const first = { ...headline('1', 'example.com', 'Election officials publish statewide results'), imageUrl: 'https://example.com/1.jpg' };
    const duplicateUrl = { ...headline('2', 'example.com', 'Different title'), url: 'https://example.com/1?utm_source=test' };
    const duplicateTitle = headline('3', 'another.com', 'Election officials publish statewide results');
    expect(deduplicateHeadlines([first, duplicateUrl, duplicateTitle])).toHaveLength(1);
  });

  it('avoids repeated publishers in the first four when alternatives exist', () => {
    const input = [
      headline('1', 'a.com'), headline('2', 'a.com'), headline('3', 'a.com'),
      headline('4', 'b.com'), headline('5', 'c.com'), headline('6', 'd.com'),
    ];
    const ranked = rankHeadlines(input, ['Top'], '2026-08-02T12:30:00.000Z');
    expect(new Set(ranked.slice(0, 4).map((item) => item.publisherDomain)).size).toBe(4);
  });
});
