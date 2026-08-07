import React, { useState } from 'react';
import type { Headline } from '../model';
import { formatNewsTimestamp } from '../../../lib/formatting';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getSafeExternalUrl } from '../utils/urls';
import { NewsImage } from './NewsImage';

interface StoryListProps {
  articles: Headline[];
  defaultVisibleCount?: number;
}

export const StoryList: React.FC<StoryListProps> = ({ articles, defaultVisibleCount = 3 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = articles.length > defaultVisibleCount;
  const visibleArticles = isExpanded ? articles : articles.slice(0, defaultVisibleCount);

  return (
    <div className={`story-list-container ${isExpanded ? 'is-expanded' : ''}`}>
      <div id="news-story-list" className="story-list-articles">
        {visibleArticles.map((story, idx) => {
          const safeUrl = getSafeExternalUrl(story.url);
          return (
          <a
            href={safeUrl}
            target={safeUrl ? '_blank' : undefined}
            rel={safeUrl ? 'noopener noreferrer' : undefined}
            aria-disabled={!safeUrl}
            key={story.id || idx}
            title={story.publisher ? `Source: ${story.publisher}` : undefined}
            className="story-list-item group"
          >
            <div className="story-list-copy">
              <h4 className="news-title type-secondary-headline font-medium text-[color:var(--text-secondary)] transition-colors leading-snug">
                {story.title}
              </h4>

              <span className="sr-only">(opens in a new tab)</span>

              <div className="story-list-metadata type-metadata">
                <span className="story-list-publisher">
                  {story.publisher}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatNewsTimestamp(story.publishedAt)}</span>
              </div>
            </div>
            {story.imageUrl && (
              <div className="story-list-image">
                <NewsImage src={story.imageUrl} className="news-image" />
              </div>
            )}
          </a>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="view-more-stories compact-control disclosure-action"
          aria-expanded={isExpanded}
          aria-controls="news-story-list"
        >
          <span>
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp aria-hidden="true" />
              </>
            ) : (
              <>
                <span>View {articles.length - defaultVisibleCount} additional stories</span>
                <ChevronDown aria-hidden="true" />
              </>
            )}
          </span>
        </button>
      )}
    </div>
  );
};
