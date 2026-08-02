import { NewsCategory } from '../../lib/types';
import { gdeltProvider } from './providers/gdeltProvider';
import { Headline } from './providers/newsProvider';

/**
 * Fetches news from the existing keyless provider. Demo data is handled only by
 * development-mode UI state and is never part of the production provider chain.
 */
export async function fetchNewsHeadlines(
  categories: NewsCategory[],
  signal?: AbortSignal
): Promise<Headline[]> {
  return gdeltProvider.fetchHeadlines(categories, signal);
}
