export type NewsCategory =
  | 'Top'
  | 'U.S.'
  | 'World'
  | 'Business'
  | 'Technology'
  | 'Science'
  | 'Sports'
  | 'Entertainment';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  publisherDomain?: string;
  url?: string;
  rankingScore?: number;
  rankingReason?: string;
}

export type NewsState =
  | { status: 'loaded'; featured: NewsArticle; secondary: NewsArticle[] }
  | { status: 'loading' }
  | { status: 'empty'; categoryName?: string }
  | { status: 'error'; errorMessage?: string }
  | { status: 'cached'; featured: NewsArticle; secondary: NewsArticle[]; lastUpdatedText: string };

export type NewsStateStatus = NewsState['status'];
