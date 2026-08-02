export type DataFreshness =
  | 'live'
  | 'delayed'
  | 'end-of-day'
  | 'cached'
  | 'stale'
  | 'unavailable'
  | 'demo';

export type RemoteState<T> =
  | { status: 'idle' }
  | { status: 'loading'; previous?: T }
  | { status: 'success'; data: T; freshness: Exclude<DataFreshness, 'unavailable'>; updatedAt: string }
  | { status: 'error'; message: string; previous?: T; freshness: 'stale' | 'unavailable' };
