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
    <div className={`flex flex-col gap-3 story-list-container ${isExpanded ? 'is-expanded' : ''}`}>
      {visibleArticles.map((story, idx) => {
        const safeUrl = getSafeExternalUrl(story.url);
        return (
        <a
          href={safeUrl}
          target={safeUrl ? '_blank' : undefined}
          rel={safeUrl ? 'noopener noreferrer' : undefined}
          aria-disabled={!safeUrl}
          key={story.id || idx}
          title={story.publisherDomain ? `Source: ${story.publisherDomain}` : undefined}
          className="story-list-item relative group block px-2 py-3 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
        >
          <div className="flex min-w-0 flex-col gap-1 flex-1">
            <h4 className="news-title type-secondary-headline font-medium text-[color:var(--text-secondary)] transition-colors leading-snug">
              {story.title}
            </h4>
            
            <span className="sr-only">(opens in a new tab)</span>

            <div className="type-metadata flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[color:var(--text-muted)]">
              <span className="font-semibold text-slate-300">
                {story.publisher}
              </span>
              <span>•</span>
              <span>{formatNewsTimestamp(story.publishedAt)}</span>
            </div>
          </div>
          {story.imageUrl && (
            <div className="w-14 h-14 rounded overflow-hidden bg-slate-800 shrink-0 border border-white/5 relative">
              <NewsImage src={story.imageUrl} className="w-full h-full object-cover" />
            </div>
          )}
        </a>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="view-more-stories compact-control w-full py-2 text-xs font-medium"
        >
          <div className="flex items-center justify-center gap-1.5">
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>View {articles.length - defaultVisibleCount} more stories</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </div>
        </button>
      )}
    </div>
  );
};
