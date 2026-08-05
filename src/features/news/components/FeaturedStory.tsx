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
      className={`featured-story group grid transition-colors relative ${article.imageUrl ? 'has-image' : 'without-image'}`}
      title={article.publisherDomain ? `Source: ${article.publisherDomain}` : undefined}
    >
      <div className="featured-story-copy">
        <div className="featured-story-metadata type-metadata">
          <span className="featured-story-category semantic-info">
            {article.categories[0]}
          </span>
          <span aria-hidden="true">·</span>
          <span className="featured-story-publisher">
            {article.publisher}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatNewsTimestamp(article.publishedAt)}</span>
        </div>

        <h3 className="news-title type-featured-headline font-semibold text-[color:var(--text-primary)] transition-colors leading-snug tracking-tight">
          {article.title}
        </h3>
        
        {/* Screen reader only external link indication */}
        <span className="sr-only">(opens in a new tab)</span>

        {article.description && (
          <p className="news-description type-body text-[color:var(--text-secondary)] leading-relaxed">
            {article.description}
          </p>
        )}
      </div>

      {article.imageUrl && (
        <div className="featured-story-image">
          <NewsImage
            src={article.imageUrl}
            className="news-image"
          />
        </div>
      )}
    </a>
  );
};
