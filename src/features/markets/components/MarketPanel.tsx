import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, RefreshCw, TrendingUp } from 'lucide-react';
import { GlassSurface } from '../../../components/common/GlassSurface';
import { useSettingsStore } from '../../../stores/settingsStore';
import type { MarketInstrument, MarketSession, MarketState } from '../model';
import { formatDisplayDateTime } from '../../../lib/formatting';

interface MarketPanelProps {
  state: MarketState;
  onRefresh: () => void;
}

export function MarketPanel({ state, onRefresh }: MarketPanelProps) {
  const { settings } = useSettingsStore();
  if (!settings.showMarkets) return null;

  const hasSnapshot = state.status === 'loaded'
    || state.status === 'cached'
    || state.status === 'stale'
    || state.status === 'partial';
  const proxies = hasSnapshot
    ? state.snapshot.instruments.filter((instrument) => instrument.type === 'etf-proxy')
    : [];
  const selectedCompanies = new Set(settings.marketSymbols);
  const companies = hasSnapshot
    ? state.snapshot.instruments.filter((instrument) => instrument.type === 'company' && selectedCompanies.has(instrument.symbol))
    : [];

  return (
    <GlassSurface className="market-panel-card panel-padding panel-stack flex min-w-0 flex-col">
      <div className="section-rule flex items-start justify-between gap-3 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[color:var(--positive)]" aria-hidden="true" />
            <h2 className="panel-heading font-semibold tracking-tight">Markets</h2>
          </div>
          <p className="panel-metadata mt-1">
            {hasSnapshot
              ? `${formatSession(state.snapshot.marketSession)} · ${formatGeneratedTime(state.snapshot.generatedAt, state.status, settings.timeFormat, settings.activeLocation?.timezone)}`
              : state.status === 'loading' ? 'Checking the latest available snapshot' : 'Snapshot unavailable'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={state.status === 'loading'}
          className="compact-control flex shrink-0 items-center gap-1.5 px-2.5 py-1 type-metadata font-semibold"
          aria-label="Check for latest market snapshot"
          title="Check the published snapshot; this does not request new Finnhub data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state.status === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
          Check
        </button>
      </div>

      {state.status === 'loading' && <MarketLoading />}
      {state.status === 'unavailable' && (
        <div className="tonal-section flex items-start gap-3 p-3" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="type-body font-semibold">Market snapshot unavailable</p>
            <p className="type-metadata mt-1 text-[color:var(--text-muted)]">{state.message}</p>
          </div>
        </div>
      )}

      {hasSnapshot && (
        <>
          {(state.status === 'partial' || state.snapshot.errors.length > 0) && (
            <p className="tonal-section semantic-warning px-3 py-2 type-metadata" role="status">
              Some quotes are unavailable or use the previous valid snapshot.
            </p>
          )}

          <div className="market-data-sections">
            <section aria-labelledby="market-proxies-heading">
              <h3 id="market-proxies-heading" className="type-label mb-2 font-semibold text-[color:var(--text-muted)]">Broad-market ETF proxies</h3>
              <div className="market-proxy-grid tonal-section">
                {proxies.map((instrument) => <MarketQuote key={instrument.symbol} instrument={instrument} proxy />)}
              </div>
            </section>

            <section aria-labelledby="market-companies-heading">
              <h3 id="market-companies-heading" className="type-label mb-2 font-semibold text-[color:var(--text-muted)]">Companies</h3>
              {companies.length > 0 ? (
                <div className="market-company-grid">
                  {companies.map((instrument) => <MarketQuote key={instrument.symbol} instrument={instrument} />)}
                </div>
              ) : (
                <p className="type-metadata text-[color:var(--text-muted)]">Selected company quotes are not present in this snapshot.</p>
              )}
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 type-metadata text-[color:var(--text-muted)]">
            <span>Market data: Finnhub</span>
            <span>{state.snapshot.freshness === 'fresh' && state.status === 'loaded' ? 'Latest available snapshot' : formatFreshness(state.status)}</span>
          </div>
        </>
      )}

      {'notice' in state && state.notice && (
        <p className="type-metadata text-[color:var(--text-secondary)]" role="status" aria-live="polite">{state.notice}</p>
      )}
    </GlassSurface>
  );
}

function MarketQuote({ instrument, proxy = false }: { instrument: MarketInstrument; proxy?: boolean }) {
  const direction = instrument.changePercent === null || instrument.changePercent === 0
    ? 'flat'
    : instrument.changePercent > 0 ? 'up' : 'down';
  const DirectionIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const directionLabel = direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'Unchanged';
  return (
    <div className={`market-quote ${proxy ? 'market-proxy-quote' : 'market-company-quote'}`}>
      <div className="min-w-0">
        <p className="truncate type-body font-semibold">{proxy ? `${instrument.proxyFor} · ${instrument.symbol} proxy` : instrument.name}</p>
        <p className="type-metadata numeric text-[color:var(--text-muted)]">{instrument.symbol}{instrument.stale ? ' · Previous snapshot' : ''}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="numeric type-body font-semibold tabular-nums">{formatPrice(instrument.price)}</p>
        <p className={`numeric type-metadata inline-flex items-center justify-end gap-0.5 tabular-nums ${direction === 'up' ? 'semantic-positive' : direction === 'down' ? 'semantic-negative' : 'text-[color:var(--text-muted)]'}`}>
          <DirectionIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{directionLabel} </span>
          {formatChange(instrument.change, instrument.changePercent)}
        </p>
      </div>
    </div>
  );
}

function MarketLoading() {
  return <div className="tonal-section flex flex-col gap-2 p-3" role="status" aria-live="polite">
    {[0, 1, 2].map((item) => <div key={item} className="flex justify-between gap-4"><span className="h-3 w-2/5 animate-pulse rounded bg-white/10" /><span className="h-3 w-1/4 animate-pulse rounded bg-white/10" /></div>)}
    <span className="sr-only">Loading the latest market snapshot</span>
  </div>;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatChange(change: number | null, percent: number | null): string {
  const parts: string[] = [];
  if (change !== null) parts.push(`${change >= 0 ? '+' : ''}${change.toFixed(2)}`);
  if (percent !== null) parts.push(`${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`);
  return parts.length > 0 ? parts.join(' · ') : 'Change unavailable';
}

function formatSession(session: MarketSession): string {
  const labels: Record<MarketSession, string> = {
    'pre-market': 'Pre-market estimate',
    regular: 'Regular session estimate',
    'after-hours': 'After-hours estimate',
    closed: 'Closed estimate',
    unknown: 'Session unknown',
  };
  return labels[session];
}

function formatGeneratedTime(generatedAt: string, status: MarketState['status'], timeFormat: '12h' | '24h', timeZone?: string): string {
  const timestamp = Date.parse(generatedAt);
  if (Number.isNaN(timestamp)) return 'Update time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  const prefix = status === 'cached' || status === 'stale' ? 'Cached snapshot' : 'Updated';
  if (minutes < 1) return `${prefix} just now`;
  if (minutes < 60) return `${prefix} ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${prefix} ${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${prefix} ${formatDisplayDateTime(new Date(timestamp), { timeFormat, timeZone })}`;
}

function formatFreshness(status: MarketState['status']): string {
  if (status === 'partial') return 'Partial data';
  if (status === 'stale') return 'Stale snapshot';
  if (status === 'cached') return 'Browser-cached';
  return 'Latest available snapshot';
}
