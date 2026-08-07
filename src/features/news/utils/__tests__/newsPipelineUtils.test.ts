import { describe, expect, it } from 'vitest';
import type { Headline } from '../../model';
import { calculateEventSimilarity, deduplicateHeadlines } from '../deduplication';
import { rankHeadlines, rankHeadlinesWithDiagnostics } from '../ranking';
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

  it('prioritizes major hard-news categories over soft-news and low-information Top stories', () => {
    const publishedAt = '2026-08-02T12:00:00.000Z';
    const input = [
      { ...headline('soft', 'celebrity.example', "Celebrity breaks silence in ultimate style guide"), categories: ['Top', 'Entertainment'] as Headline['categories'], publishedAt },
      { ...headline('science', 'nature.com', 'Researchers publish major climate model findings'), categories: ['Top', 'Science'] as Headline['categories'], publishedAt },
      { ...headline('world', 'reuters.com', 'International court issues ruling in regional conflict'), categories: ['Top', 'World'] as Headline['categories'], publishedAt },
      { ...headline('us', 'apnews.com', 'Congress approves nationwide economic security measure'), categories: ['Top', 'U.S.'] as Headline['categories'], publishedAt },
      { ...headline('business', 'bloomberg.com', 'Federal Reserve signals change to interest-rate policy'), categories: ['Top', 'Business'] as Headline['categories'], publishedAt },
    ];
    const ranked = rankHeadlines(input, ['Top'], '2026-08-02T12:30:00.000Z');
    expect(ranked.slice(0, 4).map(({ id }) => id)).toEqual(['us', 'world', 'business', 'science']);
    expect(ranked.at(-1)?.id).toBe('soft');
  });

  it('keeps duplicate event coverage out of the first five when distinct stories exist', () => {
    const input = [
      headline('event-a', 'reuters.com', 'Federal court blocks White House construction project after review'),
      headline('event-b', 'apnews.com', 'White House construction project blocked after federal court review'),
      headline('2', 'bbc.com', 'Global leaders approve regional security agreement'),
      headline('3', 'nature.com', 'Scientists report progress in long-term climate research'),
      headline('4', 'bloomberg.com', 'Central bank holds rates as inflation slows'),
      headline('5', 'npr.org', 'Congress advances bipartisan education funding measure'),
    ];
    expect(calculateEventSimilarity(input[0].title, input[1].title)).toBeGreaterThanOrEqual(0.58);
    const firstFive = rankHeadlines(input, ['Top'], '2026-08-02T12:30:00.000Z').slice(0, 5);
    expect(firstFive.filter(({ id }) => id.startsWith('event-'))).toHaveLength(1);
  });

  it('provides deterministic, inspectable diagnostics without adding them to headlines', () => {
    const input = [headline('1', 'reuters.com'), headline('2', 'unknown.example')];
    const first = rankHeadlinesWithDiagnostics(input, ['Top'], '2026-08-02T12:30:00.000Z');
    const second = rankHeadlinesWithDiagnostics(input, ['Top'], '2026-08-02T12:30:00.000Z');
    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({ sourceTier: 1, finalScore: expect.any(Number) });
    expect(first[0].components).toMatchObject({ recency: expect.any(Number), categoryRelevance: expect.any(Number) });
    expect(first[0].headline).not.toHaveProperty('finalScore');
  });
});
