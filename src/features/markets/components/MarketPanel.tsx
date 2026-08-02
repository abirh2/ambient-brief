import React from 'react';
import { TrendingUp, AlertTriangle, RefreshCw, Info, ShieldAlert } from 'lucide-react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { IndexSummary } from './IndexSummary';
import { StockList } from './StockList';
import { MarketSkeleton } from './MarketSkeleton';
import { MarketState } from '../model';
import { useSettingsStore } from '../../../stores/settingsStore';

interface MarketPanelProps {
  state: MarketState;
  onRetry?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MarketPanel: React.FC<MarketPanelProps> = ({ state, onRetry, onRefresh, isRefreshing }) => {
  const { settings } = useSettingsStore();

  if (!settings.showMarkets) {
    return null;
  }

  const isCompact = settings.contentDensity === 'compact';

  // 1. Loading state
  if (state.status === 'loading') {
    return <MarketSkeleton />;
  }

  // 2. Setup state
  if (state.status === 'setup') {
    return (
      <GlassSurface className={`market-panel-card market-setup-state ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
              Markets
            </h2>
          </div>
          <span className="text-[11px] text-indigo-400 font-sans font-medium">
            Setup Required
          </span>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="flex-grow flex flex-col items-center justify-center text-center p-6 gap-3 bg-slate-900/40 rounded-xl border border-white/5"
        >
          <div className="market-setup-icon p-3 rounded-full bg-slate-850 text-indigo-400 border border-white/5">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="text-sm font-bold text-slate-200">Alpha Vantage Key Setup</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter an optional Alpha Vantage API key in Settings to fetch latest available end-of-day market data for ETF proxies and your watchlist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-settings'));
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <span>Configure API Key</span>
          </button>
        </div>
      </GlassSurface>
    );
  }

  // 3. Rate Limited or Quota Exhausted state
  if (state.status === 'rate_limited' || state.status === 'quota_exhausted') {
    return (
      <GlassSurface className={`market-panel-card market-error-state ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
              Markets
            </h2>
          </div>
          <span className="text-[11px] text-amber-300 font-sans font-medium">
            {state.status === 'rate_limited' ? 'Rate Limited' : 'Quota Exhausted'}
          </span>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="flex-grow flex flex-col items-center justify-center text-center p-6 gap-3 bg-slate-900/40 rounded-xl border border-amber-800/30"
        >
          <div className="p-3 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="text-sm font-bold text-slate-100">
              {state.status === 'rate_limited' ? 'Alpha Vantage Rate Limit' : 'Daily Quota Reached'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {state.message}
            </p>
            {state.usage && (
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Today&apos;s usage: {state.usage.requestsAttempted} / 20 requests attempted.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again later</span>
          </button>
        </div>
      </GlassSurface>
    );
  }

  // 4. Unavailable state
  if (state.status === 'unavailable') {
    return (
      <GlassSurface className={`market-panel-card market-error-state ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full min-h-[380px]`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
              Markets
            </h2>
          </div>
          <span className="text-[11px] text-amber-300 font-sans font-medium">
            {state.lastUpdatedText || 'Unavailable'}
          </span>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="flex-grow flex flex-col items-center justify-center text-center p-6 gap-3 bg-slate-900/40 rounded-xl border border-white/5"
        >
          <div className="p-3 rounded-full bg-slate-800 text-slate-400 border border-white/10">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h3 className="text-sm font-bold text-slate-100">Market data is temporarily unavailable</h3>
            <p className="text-xs text-slate-400">
              {state.message || 'Check connection or verify API key quota.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry connection</span>
          </button>
        </div>
      </GlassSurface>
    );
  }

  // 5. Loaded or Delayed state
  const isDelayed = state.status === 'delayed';
  const indices = state.indices || [];
  const stocks = state.stocks || [];
  const sessionStatus = state.sessionStatus || 'Regular session closed · Market holiday status not independently verified';
  const usage = state.usage;

  return (
    <GlassSurface className={`market-panel-card ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col gap-4 h-full`}>
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-100">
            Markets
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-sans">
            Latest available market data · End-of-day data
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Manual refresh"
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Session state or Informative Notice */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs font-sans">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5 w-full">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-200">Session: {sessionStatus}</span>
            {usage && (
              <span className="text-[10px] font-mono text-slate-400">
                Quota: {usage.requestsAttempted}/20 today
              </span>
            )}
          </div>
          {isDelayed && (
            <span className="text-[11px] text-amber-300/90">
              {state.note || 'Showing cached or delayed market metrics.'}
            </span>
          )}
        </div>
      </div>

      {/* Index Summary Block (ETF Proxies) */}
      <IndexSummary indices={indices} />

      {/* Stock Tickers List */}
      <StockList stocks={stocks} />
    </GlassSurface>
  );
};
