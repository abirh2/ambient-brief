import { Headline } from '../providers/newsProvider';

/**
 * Normalizes title punctuation, whitespace, and removes common publisher suffixes.
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  let cleaned = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  // Common publisher suffixes to strip
  const suffixes = [
    'bbc news',
    'reuters',
    'cnn',
    'ap news',
    'associated press',
    'the guardian',
    'bloomberg',
    'cnbc',
    'wall street journal',
    'wsj',
    'new york times',
    'nyt',
    'fox news',
    'npr',
    'al jazeera',
    'the verge',
    'techcrunch',
    'wired',
  ];

  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, cleaned.length - suffix.length).trim();
    }
  }

  return cleaned;
}

/**
 * Calculates token-based Jaccard similarity between two strings.
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const tokensA = new Set(normA.split(' ').filter((t) => t.length > 2));
  const tokensB = new Set(normB.split(' ').filter((t) => t.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Deterministic deduplication pipeline for headlines.
 */
export function deduplicateHeadlines(headlines: Headline[]): Headline[] {
  if (!headlines || headlines.length === 0) return [];

  const unique: Headline[] = [];
  const seenPublishersForEvent = new Set<string>();

  // Sort by metadata completeness (has image, has summary) and recency first
  const sorted = [...headlines].sort((a, b) => {
    const scoreA = (a.imageUrl ? 2 : 0) + (a.summary ? 1 : 0) + (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() > 0 ? 0.5 : 0);
    const scoreB = (b.imageUrl ? 2 : 0) + (b.summary ? 1 : 0) + (new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime() > 0 ? 0.5 : 0);
    return scoreB - scoreA;
  });

  for (const headline of sorted) {
    if (!headline.title || !headline.url) continue;

    // Check against existing unique headlines for similarity and publisher constraints
    let isDuplicate = false;
    const publisherKey = headline.publisherDomain || headline.source;

    for (const existing of unique) {
      const similarity = calculateTitleSimilarity(headline.title, existing.title);

      // Very conservative threshold: 0.85 similarity for title duplication
      if (similarity >= 0.85) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(headline);
    }
  }

  return unique;
}
