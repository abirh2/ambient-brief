import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { useSettingsStore } from '../../../stores/settingsStore';
import {
  getTradingViewSymbols,
  loadTradingViewTickerTape,
  TRADINGVIEW_TICKER_TAPE_TAG,
} from '../tradingViewWidget';

type WidgetStatus = 'loading' | 'ready' | 'unavailable';

export function MarketPanel() {
  const { settings } = useSettingsStore();
  const widgetHostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<WidgetStatus>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const isCompact = settings.contentDensity === 'compact';
  const symbols = getTradingViewSymbols(settings.marketSymbols);

  const retry = useCallback(() => {
    setStatus('loading');
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const host = widgetHostRef.current;
    if (!host) return;

    let active = true;
    let widget: HTMLElement | null = null;
    setStatus('loading');
    host.replaceChildren();

    const initializeWidget = () => {
      if (!active) return;
      widget = document.createElement(TRADINGVIEW_TICKER_TAPE_TAG);
      widget.setAttribute('symbols', symbols);
      widget.setAttribute('theme', 'dark');
      widget.setAttribute('transparent', '');
      widget.setAttribute('item-size', 'compact');
      widget.setAttribute('hide-chart', '');
      widget.setAttribute('aria-label', 'TradingView market ticker');
      host.appendChild(widget);

      void loadTradingViewTickerTape()
        .then(() => {
          if (active) setStatus('ready');
        })
        .catch(() => {
          if (!active) return;
          widget?.remove();
          setStatus('unavailable');
        });
    };

    const initializationTimer = window.setTimeout(initializeWidget, 250);

    return () => {
      active = false;
      window.clearTimeout(initializationTimer);
      widget?.remove();
      host.replaceChildren();
    };
  }, [loadAttempt, symbols]);

  if (!settings.showMarkets) return null;

  return (
    <GlassSurface className={`market-panel-card ${isCompact ? 'p-4' : 'p-5 sm:p-6'} flex h-full min-h-[180px] flex-col gap-4`}>
      <div className="flex flex-col gap-1 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          <h2 className="text-base font-bold tracking-tight text-slate-100 sm:text-lg">Markets</h2>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Prices and exchange delay status provided by TradingView
        </span>
      </div>

      <div className="tradingview-market-shell relative flex min-h-[76px] w-full flex-1 items-center" aria-busy={status === 'loading'}>
        <div ref={widgetHostRef} className={`tradingview-widget-host w-full ${status === 'ready' ? 'is-ready' : ''}`} />

        {status === 'loading' && (
          <div className="market-widget-placeholder absolute inset-0 flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/45 px-4" role="status" aria-live="polite">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/10" />
            <div className="flex w-full flex-col gap-2">
              <span className="h-2.5 w-2/3 animate-pulse rounded bg-white/10" />
              <span className="h-2 w-1/3 animate-pulse rounded bg-white/5" />
            </div>
            <span className="sr-only">Loading TradingView market data</span>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="absolute inset-0 flex items-center justify-between gap-3 rounded-xl border border-amber-800/30 bg-slate-900/60 px-4" role="alert">
            <div className="flex min-w-0 items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-100">TradingView market data is unavailable</p>
                <p className="text-[11px] text-slate-400">The third-party widget may be blocked by your browser, network, or content security policy.</p>
              </div>
            </div>
            <button type="button" onClick={retry} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500">
        S&amp;P 500, Dow Jones Industrial Average, and Nasdaq Composite are displayed as index instruments—not ETF proxies. TradingView determines whether each exchange feed is real-time, delayed, or end-of-day.
      </p>
    </GlassSurface>
  );
}
