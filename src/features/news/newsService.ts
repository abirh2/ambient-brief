import type { NewsCategory } from './model';
import { staticNewsProvider } from './providers/staticNewsProvider';

export function fetchNewsHeadlines(categories: NewsCategory[], signal?: AbortSignal) {
  return staticNewsProvider.fetchHeadlines(categories, signal);
}
