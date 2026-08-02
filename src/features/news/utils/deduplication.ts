import type { Headline, NewsCategory } from '../model.ts';
import { getCanonicalArticleUrl } from './urls.ts';

const PUBLISHER_SUFFIXES = [
  'bbc news', 'reuters', 'cnn', 'ap news', 'associated press', 'the guardian',
  'bloomberg', 'cnbc', 'wall street journal', 'wsj', 'new york times', 'nyt',
  'fox news', 'npr', 'al jazeera', 'the verge', 'techcrunch', 'wired',
];

export function stripPublisherSuffix(title: string, publisher?: string): string {
  const candidates = publisher ? [...PUBLISHER_SUFFIXES, publisher.toLowerCase()] : PUBLISHER_SUFFIXES;
  for (const suffix of [...new Set(candidates)].sort((a, b) => b.length - a.length)) {
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stripped = title.replace(new RegExp(`\\s+(?:[-–—|:]\\s*)${escaped}$`, 'i'), '').trim();
    if (stripped !== title && stripped.length >= 15) return stripped;
  }
  return title.trim();
}

export function normalizeTitle(title: string): string {
  return stripPublisherSuffix(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);
  if (normA === normB) return normA ? 1 : 0;

  const tokensA = new Set(normA.split(' ').filter((token) => token.length > 2));
  const tokensB = new Set(normB.split(' ').filter((token) => token.length > 2));
  if (tokensA.size < 3 || tokensB.size < 3) return 0;
  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  return intersection / new Set([...tokensA, ...tokensB]).size;
}

function metadataScore(headline: Headline): number {
  return (headline.imageUrl ? 2 : 0) + (headline.description ? 1 : 0) +
    (headline.publisherDomain ? 1 : 0);
}

function mergeCategories(a: NewsCategory[], b: NewsCategory[]): NewsCategory[] {
  return [...new Set([...a, ...b])];
}

function choosePreferred(a: Headline, b: Headline): Headline {
  const scoreDifference = metadataScore(b) - metadataScore(a);
  const preferred = scoreDifference > 0 || (scoreDifference === 0 && b.publishedAt > a.publishedAt) ? b : a;
  return { ...preferred, categories: mergeCategories(a.categories, b.categories) };
}

export function deduplicateHeadlines(headlines: Headline[]): Headline[] {
  const sorted = [...headlines].sort((a, b) => {
    const completeness = metadataScore(b) - metadataScore(a);
    return completeness || b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id);
  });
  const unique: Headline[] = [];

  for (const headline of sorted) {
    const canonicalUrl = getCanonicalArticleUrl(headline.url);
    if (!headline.title || !canonicalUrl) continue;

    const duplicateIndex = unique.findIndex((existing) => {
      const sameUrl = getCanonicalArticleUrl(existing.url) === canonicalUrl;
      if (sameUrl) return true;
      const similarity = calculateTitleSimilarity(headline.title, existing.title);
      if (similarity === 1 || similarity >= 0.92) return true;
      const hoursApart = Math.abs(Date.parse(headline.publishedAt) - Date.parse(existing.publishedAt)) / 3_600_000;
      return headline.publisherDomain === existing.publisherDomain && hoursApart <= 36 && similarity >= 0.78;
    });

    if (duplicateIndex < 0) unique.push({ ...headline, url: canonicalUrl });
    else unique[duplicateIndex] = choosePreferred(unique[duplicateIndex], headline);
  }
  return unique;
}
