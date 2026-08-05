import React, { useState } from 'react';
import type { Headline } from '../model';
import { formatNewsTimestamp } from '../../../lib/formatting';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getSafeExternalUrl } from '../utils/urls';
import { NewsImage } from './NewsImage';

interface StoryListProps {
  articles: Headline[];
}

export const StoryList: React.FC<StoryListProps> = ({ articles }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const defaultVisibleCount = 3;
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
          className="story-list-item relative group block p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
        >
          <div className="flex min-w-0 flex-col gap-1 flex-1">
            <h4 className="news-title text-xs sm:text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
              {story.title}
            </h4>
            
            <span className="sr-only">(opens in a new tab)</span>

            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 font-sans">
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
          className="view-more-stories w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors border border-dashed border-white/10"
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
