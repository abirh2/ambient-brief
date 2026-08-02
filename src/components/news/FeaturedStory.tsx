import React from 'react';
import { Headline } from '../../features/news/providers/newsProvider';
import { formatNewsTimestamp } from '../../lib/formatting/dateUtils';
import { formatPublisherName } from '../../features/news/utils/sourceMapper';

interface FeaturedStoryProps {
  article: Headline;
}

export const FeaturedStory: React.FC<FeaturedStoryProps> = ({ article }) => {
  return (
    <a
      href={article.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:bg-white/5 transition-all relative block"
      title={article.publisherDomain ? `Source: ${article.publisherDomain}` : undefined}
    >
      <div className="flex flex-col justify-between flex-1 gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
          <span className="font-semibold text-indigo-400 tracking-wider uppercase text-[10px] bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
            {article.category}
          </span>
          <span>•</span>
          <span className="font-medium text-slate-300">
            {formatPublisherName(article.publisherDomain || article.source)}
          </span>
          <span>•</span>
          <span className="text-slate-400">{formatNewsTimestamp(article.publishedAt)}</span>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug tracking-tight">
          {article.title}
        </h3>
        
        {/* Screen reader only external link indication */}
        <span className="sr-only">(opens in a new tab)</span>

        {article.summary && (
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}
      </div>

      {article.imageUrl && (
        <div className="w-full md:w-36 h-28 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10 relative">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Dev-only ranking info */}
      {import.meta.env.DEV && article.rankingScore !== undefined && (
        <div className="absolute top-2 right-2 text-[9px] bg-black/80 text-green-400 p-1 rounded hidden group-hover:block z-10 max-w-[200px]">
          <div>Score: {article.rankingScore.toFixed(1)}</div>
          <div className="opacity-70 leading-tight mt-1">{article.rankingReason}</div>
        </div>
      )}
    </a>
  );
};
