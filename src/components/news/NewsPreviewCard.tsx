import React, { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { NewsArticle } from '../../lib/types';
import { formatRelativeTime } from '../../lib/formatting/dateUtils';
import { formatPublisherName } from '../../features/news/utils/sourceMapper';

interface NewsPreviewCardProps {
  articles: NewsArticle[];
  categories?: string[];
}

export const NewsPreviewCard: React.FC<NewsPreviewCardProps> = ({
  articles,
  categories = ['Top', 'Tech', 'Business', 'World'],
}) => {
  const [activeCategory, setActiveCategory] = useState('Top');

  const filteredArticles =
    activeCategory === 'Top'
      ? articles
      : articles.filter((a) => a.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold tracking-tight text-slate-100">Top Stories</h2>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full transition-all font-medium whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-600/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar max-h-[380px] pr-1">
        {filteredArticles.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No mock stories found for category &ldquo;{activeCategory}&rdquo;.
          </div>
        ) : (
          filteredArticles.map((article, idx) => (
            <React.Fragment key={article.id}>
              {idx > 0 && <div className="h-px w-full bg-white/5" />}
              <a
                href={article.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                title={article.publisherDomain ? `Source: ${article.publisherDomain}` : undefined}
                className="group flex gap-4 justify-between items-start block relative"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
                      {article.category}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400 font-sans">{formatPublisherName(article.publisherDomain || article.source)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(article.publishedAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  
                  <span className="sr-only">(opens in a new tab)</span>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-normal">
                    {article.summary}
                  </p>
                </div>

                {article.imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/5 relative">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
              </a>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};
