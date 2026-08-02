import { describe, expect, it } from 'vitest';
import type { Headline } from '../../model';
import { filterStoriesForCategory } from '../NewsPanel';

const worldStory: Headline = {
  id: 'world-story',
  title: 'World story',
  publisher: 'Example',
  publisherDomain: 'example.com',
  publishedAt: '2026-08-02T12:00:00.000Z',
  url: 'https://example.com/world',
  categories: ['Top', 'World'],
};

describe('NewsPanel category filtering', () => {
  it('never substitutes unrelated stories for an empty category tab', () => {
    expect(filterStoriesForCategory([worldStory], 'Technology')).toEqual([]);
  });

  it('returns only stories explicitly assigned to the active category', () => {
    const technologyStory: Headline = {
      ...worldStory,
      id: 'technology-story',
      title: 'Technology story',
      url: 'https://example.com/technology',
      categories: ['Top', 'Technology'],
    };
    expect(filterStoriesForCategory([worldStory, technologyStory], 'Technology')).toEqual([technologyStory]);
  });
});
