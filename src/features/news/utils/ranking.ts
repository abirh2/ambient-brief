import type { Headline, NewsCategory } from '../model.ts';
import { calculateEventSimilarity } from './deduplication.ts';
import {
  getSourceTier,
  mergeNewsRankingConfig,
  type NewsRankingConfig,
  type SourceTier,
} from './rankingConfig.ts';

const PUBLIC_INTEREST_TERMS = /\b(government|congress|court|election|economy|inflation|war|conflict|climate|health|research|security|technology|education|energy)\b/i;
const LOCAL_TERMS = /\b(city council|county board|school board|local police|township|municipal|neighborhood|parish council)\b/i;
const SOFT_NEWS_TERMS = /\b(celebrity|fashion|beauty|dating|royal family|red carpet|style guide|horoscope|reality star|influencer|pedicure|final moments|estate battle)\b/i;
const SPORTS_TERMS = /\b(champions league|football|baseball|basketball|outfielder|home run|formula 1|F1|match|tournament|coach|season opener)\b/i;
const PROMOTIONAL_TERMS = /\b(last day|get up to \$?\d+ off|buy now|ticket sales?|register now|sponsored)\b/i;
const LOCAL_CRIME_TERMS = /\b(local police|doorbell camera|facing \d+ charges|county sheriff|downstate|city shooting)\b/i;
const LOW_INFORMATION_TERMS = /\b(you won't believe|what to know|everything we know|details emerge|breaks silence|fans react|goes viral|simple rules|ultimate guide|who is .+\?|age, career, salary)\b/i;
const OPINION_TERMS = /\b(opinion|commentary|column:|editorial:|my take)\b/i;

export interface RankingComponents {
  recency: number;
  categoryRelevance: number;
  sourceReputation: number;
  headlineInformativeness: number;
  metadataCompleteness: number;
  publicInterest: number;
  editorialAdjustment: number;
  sourceDiversity: number;
  duplicateSimilarity: number;
}

export interface RankedHeadlineDiagnostic {
  headline: Headline;
  sourceTier: SourceTier;
  components: RankingComponents;
  finalScore: number;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function topCategoryScore(headline: Headline, config: NewsRankingConfig): number {
  return Math.max(0, ...headline.categories.map((category) => config.topCategoryPoints[category] ?? 0));
}

function headlineInformativeness(title: string): number {
  const words = title.trim().split(/\s+/).length;
  let score = words >= 6 && words <= 18 ? 12 : words >= 4 && words <= 24 ? 7 : 1;
  if (title.length >= 40 && title.length <= 135) score += 4;
  if (LOW_INFORMATION_TERMS.test(title)) score -= 10;
  if (/^[^a-z]*$/.test(title)) score -= 8;
  if (/\|/.test(title)) score -= 3;
  return score;
}

function metadataCompleteness(headline: Headline): number {
  let score = 0;
  if (headline.publisher && !headline.publisher.includes('.')) score += 3;
  if (headline.publisherDomain) score += 2;
  if (headline.description && headline.description.length >= 30) score += 3;
  if (headline.imageUrl) score += 2;
  return score;
}

function baseComponents(
  headline: Headline,
  targetCategories: NewsCategory[],
  referenceTime: number,
  config: NewsRankingConfig,
): Omit<RankingComponents, 'sourceDiversity' | 'duplicateSimilarity'> {
  const ageHours = Math.max(0, (referenceTime - Date.parse(headline.publishedAt)) / 3_600_000);
  const recency = 28 * Math.pow(0.5, ageHours / config.recencyHalfLifeHours);
  const isTop = targetCategories.includes('Top');
  const categoryRelevance = isTop
    ? topCategoryScore(headline, config)
    : headline.categories.some((category) => targetCategories.includes(category)) ? 28 : 0;
  const sourceTier = getSourceTier(headline.publisherDomain, config);
  const text = `${headline.title} ${headline.description ?? ''}`;
  const publicInterest = PUBLIC_INTEREST_TERMS.test(text) ? 6 : 0;
  let editorialAdjustment = 0;
  if (isTop && headline.categories.includes('Entertainment')) editorialAdjustment -= 26;
  if (isTop && (SOFT_NEWS_TERMS.test(text) || OPINION_TERMS.test(headline.title))) editorialAdjustment -= 38;
  if (isTop && config.topSoftNewsDomains.some((domain) =>
    headline.publisherDomain === domain || headline.publisherDomain.endsWith(`.${domain}`))) editorialAdjustment -= 38;
  if (isTop && SPORTS_TERMS.test(text)) editorialAdjustment -= 34;
  if (isTop && PROMOTIONAL_TERMS.test(text)) editorialAdjustment -= 42;
  if (isTop && LOCAL_CRIME_TERMS.test(text)) editorialAdjustment -= 24;
  if (isTop && LOCAL_TERMS.test(headline.title) &&
      !config.localContextTerms.some((term) => text.toLowerCase().includes(term.toLowerCase()))) {
    editorialAdjustment -= 16;
  }
  return {
    recency,
    categoryRelevance,
    sourceReputation: config.sourceTierPoints[sourceTier],
    headlineInformativeness: headlineInformativeness(headline.title),
    metadataCompleteness: metadataCompleteness(headline),
    publicInterest,
    editorialAdjustment,
  };
}

function componentTotal(components: RankingComponents): number {
  return Object.values(components).reduce((total, component) => total + component, 0);
}

/**
 * Returns inspectable, deterministic ranking diagnostics. Callers may log these
 * during feed generation, but they are deliberately excluded from feed schemas.
 */
export function rankHeadlinesWithDiagnostics(
  headlines: Headline[],
  targetCategories: NewsCategory[],
  referenceTime: string | number,
  overrides: Partial<NewsRankingConfig> = {},
): RankedHeadlineDiagnostic[] {
  const config = mergeNewsRankingConfig(overrides);
  const referenceMs = typeof referenceTime === 'number' ? referenceTime : Date.parse(referenceTime);
  const remaining = headlines.map((headline) => ({
    headline,
    sourceTier: getSourceTier(headline.publisherDomain, config),
    base: baseComponents(headline, targetCategories, referenceMs, config),
  }));
  const ranked: RankedHeadlineDiagnostic[] = [];

  while (remaining.length > 0) {
    const hasUnusedPublisher = ranked.length < 4 && remaining.some(({ headline }) =>
      !ranked.some((selected) => selected.headline.publisherDomain === headline.publisherDomain));
    const hasDistinctEvent = ranked.length < 5 && remaining.some(({ headline }) =>
      ranked.every((selected) =>
        calculateEventSimilarity(selected.headline.title, headline.title) < config.duplicateSimilarityThreshold));
    const eligible = remaining.filter(({ headline }) => {
      if (hasUnusedPublisher && ranked.some((selected) =>
        selected.headline.publisherDomain === headline.publisherDomain)) return false;
      if (hasDistinctEvent && ranked.some((selected) =>
        calculateEventSimilarity(selected.headline.title, headline.title) >= config.duplicateSimilarityThreshold)) return false;
      return true;
    });
    const candidates = eligible.map((candidate) => {
      const publisherAlreadyVisible = ranked.slice(0, 4).some(({ headline }) =>
        headline.publisherDomain === candidate.headline.publisherDomain);
      const maximumSimilarity = Math.max(0, ...ranked.slice(0, 5).map(({ headline }) =>
        calculateEventSimilarity(headline.title, candidate.headline.title)));
      const components: RankingComponents = {
        ...candidate.base,
        sourceDiversity: ranked.length < 4 && publisherAlreadyVisible ? -config.repeatedPublisherPenalty : 0,
        duplicateSimilarity: ranked.length < 5 && maximumSimilarity >= config.duplicateSimilarityThreshold
          ? -config.duplicatePenalty * maximumSimilarity
          : 0,
      };
      return {
        headline: candidate.headline,
        sourceTier: candidate.sourceTier,
        components,
        finalScore: roundScore(componentTotal(components)),
      };
    }).sort((a, b) =>
      b.finalScore - a.finalScore ||
      b.headline.publishedAt.localeCompare(a.headline.publishedAt) ||
      a.headline.id.localeCompare(b.headline.id));

    const winner = candidates[0];
    ranked.push(winner);
    remaining.splice(remaining.findIndex(({ headline }) => headline === winner.headline), 1);
  }
  return ranked;
}

export function rankHeadlines(
  headlines: Headline[],
  targetCategories: NewsCategory[],
  referenceTime: string | number = Date.now(),
  config: Partial<NewsRankingConfig> = {},
): Headline[] {
  return rankHeadlinesWithDiagnostics(headlines, targetCategories, referenceTime, config)
    .map(({ headline }) => headline);
}
