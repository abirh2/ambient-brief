import { NewsCategory, NewsArticle } from '../../lib/types';
import { gdeltProvider } from './providers/gdeltProvider';
import { GuardianNewsProvider } from './providers/guardianProvider';
import { mockProvider } from './providers/mockProvider';
import { Headline, NewsProvider } from './providers/newsProvider';
import { runGdeltFeasibilityTest, GdeltTestReport } from './providers/gdeltFeasibilityTest';

let cachedFeasibilityReport: GdeltTestReport | null = null;

export async function getOrRunGdeltFeasibilityTest(): Promise<GdeltTestReport> {
  if (cachedFeasibilityReport) return cachedFeasibilityReport;
  cachedFeasibilityReport = await runGdeltFeasibilityTest();
  return cachedFeasibilityReport;
}

/**
 * Main news fetching function that prioritizes GDELT as the default keyless provider,
 * with fallback to Guardian or Mock provider.
 */
export async function fetchNewsHeadlines(
  categories: NewsCategory[],
  userApiKey?: string,
  signal?: AbortSignal
): Promise<Headline[]> {
  // Try GDELT first as default keyless provider
  try {
    const gdeltResults = await gdeltProvider.fetchHeadlines(categories, signal);
    if (gdeltResults && gdeltResults.length > 0) {
      return gdeltResults;
    }
  } catch (err) {
    console.info('[NewsService] GDELT keyless provider unavailable (CORS/network), gracefully falling back to alternative news sources.');
  }

  // Fallback 1: Guardian API if user configured key or default key
  try {
    const guardian = new GuardianNewsProvider(userApiKey);
    const guardianResults = await guardian.fetchHeadlines(categories);
    if (guardianResults && guardianResults.length > 0) {
      return guardianResults;
    }
  } catch (err) {
    console.warn('[NewsService] Guardian fallback failed:', err);
  }

  // Fallback 2: Mock provider for absolute reliability
  const mockResults = await mockProvider.fetchHeadlines(categories);
  return mockResults;
}

// Retain legacy export for backward compatibility if needed by tests or other components
export async function fetchNewsArticles(
  categories: string[],
  userApiKey?: string
): Promise<NewsArticle[]> {
  const headlines = await fetchNewsHeadlines(categories as NewsCategory[], userApiKey);
  return headlines.map((h) => ({
    id: h.id,
    title: h.title,
    summary: h.summary,
    category: h.category,
    source: h.source,
    publishedAt: h.publishedAt,
    imageUrl: h.imageUrl,
    url: h.url,
  }));
}
