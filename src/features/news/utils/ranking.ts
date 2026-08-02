import type { Headline, NewsCategory } from '../model.ts';

const HARD_NEWS: NewsCategory[] = ['U.S.', 'World', 'Business', 'Technology', 'Science'];
const PUBLIC_INTEREST_TERMS = /\b(government|congress|court|election|economy|inflation|war|conflict|climate|health|research|security|technology)\b/i;
const LOCAL_TERMS = /\b(city council|county board|school board|local police|township|municipal)\b/i;

function scoreHeadline(headline: Headline, targetCategories: NewsCategory[], referenceTime: number): number {
  const ageHours = Math.max(0, (referenceTime - Date.parse(headline.publishedAt)) / 3_600_000);
  let score = Math.max(0, 100 - ageHours * 2) * 0.45;
  if (headline.categories.some((category) => targetCategories.includes(category))) score += 24;
  if (headline.imageUrl) score += 10;
  if (headline.description && headline.description.length >= 30) score += 8;
  if (headline.publisherDomain) score += 4;

  if (targetCategories.includes('Top')) {
    if (headline.categories.some((category) => HARD_NEWS.includes(category))) score += 16;
    if (headline.categories.includes('Entertainment')) score -= 22;
    if (PUBLIC_INTEREST_TERMS.test(`${headline.title} ${headline.description ?? ''}`)) score += 8;
    if (LOCAL_TERMS.test(headline.title) && !PUBLIC_INTEREST_TERMS.test(headline.title)) score -= 12;
  }
  if (headline.title === headline.title.toUpperCase()) score -= 12;
  if (headline.title.length < 15 || headline.title.length > 180) score -= 8;
  return score;
}

/** Deterministic ranking: fixed reference time, then stable title/id tie-breakers. */
export function rankHeadlines(
  headlines: Headline[],
  targetCategories: NewsCategory[],
  referenceTime: string | number = Date.now(),
): Headline[] {
  const referenceMs = typeof referenceTime === 'number' ? referenceTime : Date.parse(referenceTime);
  const scored = headlines.map((headline) => ({
    headline,
    score: scoreHeadline(headline, targetCategories, referenceMs),
  })).sort((a, b) => b.score - a.score || b.headline.publishedAt.localeCompare(a.headline.publishedAt) || a.headline.id.localeCompare(b.headline.id));

  const firstFour: typeof scored = [];
  const remaining = [...scored];
  while (firstFour.length < 4 && remaining.length > 0) {
    const used = new Set(firstFour.map(({ headline }) => headline.publisherDomain));
    const diverseIndex = remaining.findIndex(({ headline }) => !used.has(headline.publisherDomain));
    firstFour.push(remaining.splice(diverseIndex >= 0 ? diverseIndex : 0, 1)[0]);
  }
  return [...firstFour, ...remaining].map(({ headline }) => headline);
}
