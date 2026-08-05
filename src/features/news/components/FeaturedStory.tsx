import React from 'react';
import type { Headline } from '../model';
import { formatNewsTimestamp } from '../../../lib/formatting';
import { getSafeExternalUrl } from '../utils/urls';
import { NewsImage } from './NewsImage';

interface FeaturedStoryProps {
  article: Headline;
}

export const FeaturedStory: React.FC<FeaturedStoryProps> = ({ article }) => {
  const safeUrl = getSafeExternalUrl(article.url);

  return (
    <a
      href={safeUrl}
      target={safeUrl ? '_blank' : undefined}
      rel={safeUrl ? 'noopener noreferrer' : undefined}
      aria-disabled={!safeUrl}
      className="featured-story group flex flex-col md:flex-row gap-4 p-4 transition-colors relative block"
      title={article.publisherDomain ? `Source: ${article.publisherDomain}` : undefined}
    >
      <div className="flex min-w-0 flex-col justify-between flex-1 gap-2">
        <div className="type-metadata flex min-w-0 flex-wrap items-center gap-2 text-[color:var(--text-muted)]">
          <span className="font-semibold semantic-info">
            {article.categories[0]}
          </span>
          <span>•</span>
          <span className="font-medium text-slate-300">
            {article.publisher}
          </span>
          <span>•</span>
          <span className="text-slate-400">{formatNewsTimestamp(article.publishedAt)}</span>
        </div>

        <h3 className="news-title type-featured-headline font-semibold text-[color:var(--text-primary)] transition-colors leading-snug tracking-tight">
          {article.title}
        </h3>
        
        {/* Screen reader only external link indication */}
        <span className="sr-only">(opens in a new tab)</span>

        {article.description && (
          <p className="news-description type-body text-[color:var(--text-secondary)] line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}
      </div>

      {article.imageUrl && (
        <div className="w-full md:w-36 h-28 rounded-[var(--radius-control)] overflow-hidden bg-slate-800/50 shrink-0 relative">
          <NewsImage
            src={article.imageUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </a>
  );
};
