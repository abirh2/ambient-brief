import type { NewsCategory } from '../model.ts';

export type SourceTier = 1 | 2 | 3 | 4;

export interface NewsRankingConfig {
  sourceTiers: Readonly<Record<string, SourceTier>>;
  sourceTierPoints: Readonly<Record<SourceTier, number>>;
  topCategoryPoints: Readonly<Partial<Record<NewsCategory, number>>>;
  recencyHalfLifeHours: number;
  duplicateSimilarityThreshold: number;
  duplicatePenalty: number;
  repeatedPublisherPenalty: number;
  localContextTerms: readonly string[];
  topSoftNewsDomains: readonly string[];
}

/**
 * Editorial defaults for the generated feed. These values affect ranking only:
 * sources remain eligible for their category feeds regardless of tier.
 */
export const DEFAULT_NEWS_RANKING_CONFIG: NewsRankingConfig = {
  sourceTiers: {
    'apnews.com': 1,
    'reuters.com': 1,
    'bbc.com': 1,
    'bbc.co.uk': 1,
    'nytimes.com': 1,
    'washingtonpost.com': 1,
    'wsj.com': 1,
    'bloomberg.com': 1,
    'npr.org': 1,
    'theguardian.com': 1,
    'cnn.com': 2,
    'cbsnews.com': 2,
    'nbcnews.com': 2,
    'abcnews.go.com': 2,
    'politico.com': 2,
    'axios.com': 2,
    'cnbc.com': 2,
    'ft.com': 2,
    'economist.com': 2,
    'aljazeera.com': 2,
    'theverge.com': 2,
    'arstechnica.com': 2,
    'wired.com': 2,
    'techcrunch.com': 3,
    'newsweek.com': 3,
    'financialpost.com': 3,
    'investing.com': 3,
    'dailymail.com': 3,
    'frontiersin.org': 2,
    'scientificamerican.com': 2,
    'nature.com': 1,
    'science.org': 1,
  },
  sourceTierPoints: { 1: 18, 2: 13, 3: 8, 4: 2 },
  topCategoryPoints: {
    'U.S.': 32,
    World: 27,
    Business: 22,
    Technology: 17,
    Science: 16,
    Top: 8,
  },
  recencyHalfLifeHours: 18,
  duplicateSimilarityThreshold: 0.58,
  duplicatePenalty: 34,
  repeatedPublisherPenalty: 22,
  localContextTerms: [],
  topSoftNewsDomains: ['eonline.com', 'bustle.com', 'hellomagazine.com'],
};

export function mergeNewsRankingConfig(
  overrides: Partial<NewsRankingConfig> = {},
): NewsRankingConfig {
  return {
    ...DEFAULT_NEWS_RANKING_CONFIG,
    ...overrides,
    sourceTiers: { ...DEFAULT_NEWS_RANKING_CONFIG.sourceTiers, ...overrides.sourceTiers },
    sourceTierPoints: { ...DEFAULT_NEWS_RANKING_CONFIG.sourceTierPoints, ...overrides.sourceTierPoints },
    topCategoryPoints: { ...DEFAULT_NEWS_RANKING_CONFIG.topCategoryPoints, ...overrides.topCategoryPoints },
  };
}

export function getSourceTier(domain: string, config: NewsRankingConfig): SourceTier {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  const match = Object.entries(config.sourceTiers).find(([knownDomain]) =>
    normalized === knownDomain || normalized.endsWith(`.${knownDomain}`));
  return match?.[1] ?? 4;
}
