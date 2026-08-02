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
      className="group flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:bg-white/5 transition-all relative block"
      title={article.publisherDomain ? `Source: ${article.publisherDomain}` : undefined}
    >
      <div className="flex flex-col justify-between flex-1 gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
          <span className="font-semibold text-indigo-400 tracking-wider uppercase text-[10px] bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
            {article.categories[0]}
          </span>
          <span>•</span>
          <span className="font-medium text-slate-300">
            {article.publisher}
          </span>
          <span>•</span>
          <span className="text-slate-400">{formatNewsTimestamp(article.publishedAt)}</span>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug tracking-tight">
          {article.title}
        </h3>
        
        {/* Screen reader only external link indication */}
        <span className="sr-only">(opens in a new tab)</span>

        {article.description && (
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}
      </div>

      {article.imageUrl && (
        <div className="w-full md:w-36 h-28 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/10 relative">
          <NewsImage
            src={article.imageUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </a>
  );
};
