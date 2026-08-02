import { NewsCategory } from '../../lib/types';
import { gdeltProvider } from './providers/gdeltProvider';
import { Headline } from './providers/newsProvider';

export const NEWS_PROVIDER_AVAILABILITY = {
  status: import.meta.env.DEV ? 'unverified-development' : 'unavailable',
  provider: 'GDELT DOC 2.0',
  checkedAt: '2026-08-02',
  reason:
    'Deployed-origin verification did not pass: the configured GitHub Pages URL returned 404 and the GDELT article-list GET returned HTTP 429.',
} as const;

export function isNewsProviderEnabled(isDevelopment = import.meta.env.DEV): boolean {
  return isDevelopment;
}

export class NewsProviderUnavailableError extends Error {
  constructor() {
    super(NEWS_PROVIDER_AVAILABILITY.reason);
    this.name = 'NewsProviderUnavailableError';
  }
}

/**
 * Fetches news from the existing keyless provider. Demo data is handled only by
 * development-mode UI state and is never part of the production provider chain.
 */
export async function fetchNewsHeadlines(
  categories: NewsCategory[],
  signal?: AbortSignal
): Promise<Headline[]> {
  if (!isNewsProviderEnabled()) {
    throw new NewsProviderUnavailableError();
  }

  return gdeltProvider.fetchHeadlines(categories, signal);
}
