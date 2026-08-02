import { Headline } from '../providers/newsProvider';
import { NewsCategory } from '../../../lib/types';
import { calculateTitleSimilarity } from './deduplication';

/**
 * Ranks headlines using a transparent client-side heuristic:
 * 1. Recency (newer stories score higher)
 * 2. Category relevance (prioritize hard news for Top, deprioritize lifestyle)
 * 3. Source diversity (penalty for repeated publishers)
 * 4. Metadata completeness (has image, valid summary)
 * 5. Headline clarity (penalize ALL CAPS, overly short/long headlines)
 * 6. Duplicate suppression (penalize similarity to higher ranked items)
 */
export function rankHeadlines(
  headlines: Headline[],
  targetCategories: NewsCategory[]
): Headline[] {
  if (!headlines || headlines.length === 0) return [];

  const now = Date.now();
  const isTopCategory = targetCategories.includes('Top');
  const isEntertainment = targetCategories.includes('Entertainment');

  // Initial scoring
  let scored = headlines.map((headline) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Recency score (decay over 48 hours)
    try {
      const pubTime = new Date(headline.publishedAt).getTime();
      const ageHours = Math.max(0, (now - pubTime) / (1000 * 60 * 60));
      const recencyScore = Math.max(0, 100 - ageHours * 2);
      score += recencyScore * 0.4;
      reasons.push(`Recency: +${(recencyScore * 0.4).toFixed(1)}`);
    } catch {
      score += 20;
      reasons.push(`Recency (fallback): +20`);
    }

    // 2. Metadata completeness score
    if (headline.imageUrl) {
      score += 25;
      reasons.push(`Has Image: +25`);
    }
    if (headline.summary && headline.summary.length > 20) {
      score += 15;
      reasons.push(`Has Summary: +15`);
    }
    if (headline.publisherDomain) {
      score += 5;
      reasons.push(`Known Publisher: +5`);
    }

    // 3. Category relevance score
    if (targetCategories.includes(headline.category as NewsCategory)) {
      score += 20;
      reasons.push(`Direct Category Match: +20`);
    }

    if (isTopCategory) {
      const hardNewsCategories = ['U.S.', 'World', 'Business', 'Technology', 'Science'];
      if (hardNewsCategories.includes(headline.category)) {
        score += 15;
        reasons.push(`Hard News Boost: +15`);
      }
      
      const softNewsCategories = ['Entertainment', 'Lifestyle', 'Celebrity'];
      if (softNewsCategories.includes(headline.category)) {
        score -= 20;
        reasons.push(`Soft News Penalty: -20`);
      }
      
      if (headline.category === 'Local') {
        score -= 10;
        reasons.push(`Local News Penalty: -10`);
      }
    } else if (isEntertainment) {
      if (['Entertainment', 'Lifestyle', 'Celebrity'].includes(headline.category)) {
        score += 15;
        reasons.push(`Entertainment Match: +15`);
      }
    }

    // 4. Headline clarity
    if (headline.title) {
      if (headline.title === headline.title.toUpperCase()) {
        score -= 15;
        reasons.push(`ALL CAPS Penalty: -15`);
      }
      if (headline.title.length < 15) {
        score -= 10;
        reasons.push(`Short Title Penalty: -10`);
      }
    }

    return { headline, score, reasons };
  });

  // Sort by initial score to process source diversity and duplicate suppression in order
  scored.sort((a, b) => b.score - a.score);

  const publisherCounts = new Map<string, number>();
  const finalScored: typeof scored = [];

  for (let i = 0; i < scored.length; i++) {
    const item = scored[i];
    const pubKey = item.headline.publisherDomain || item.headline.source;
    
    // 5. Source diversity penalty (more severe for first 4 visible)
    const count = publisherCounts.get(pubKey) || 0;
    if (count > 0) {
      // If within first 4 slots and seeing duplicate publisher, heavily penalize
      const penalty = i < 4 ? 40 * count : 15 * count;
      item.score -= penalty;
      item.reasons.push(`Publisher Diversity Penalty (${count}): -${penalty}`);
    }
    publisherCounts.set(pubKey, count + 1);

    // 6. Duplicate suppression (penalize if similar to already accepted highly ranked stories)
    let maxSim = 0;
    for (const accepted of finalScored) {
      const sim = calculateTitleSimilarity(item.headline.title, accepted.headline.title);
      if (sim > maxSim) maxSim = sim;
    }
    
    if (maxSim > 0.5) {
      const penalty = Math.floor(maxSim * 50);
      item.score -= penalty;
      item.reasons.push(`Similarity Penalty (${maxSim.toFixed(2)}): -${penalty}`);
    }

    // Record debugging info
    item.headline.rankingScore = item.score;
    item.headline.rankingReason = item.reasons.join(', ');

    finalScored.push(item);
  }

  // Final sort after all dynamic penalties
  finalScored.sort((a, b) => b.score - a.score);

  return finalScored.map((item) => item.headline);
}
