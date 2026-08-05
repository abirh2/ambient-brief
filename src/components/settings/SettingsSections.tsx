import { Check, Compass, Database, DollarSign, Monitor, Moon, Newspaper, RefreshCw, ShieldCheck, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import type { BackgroundMotion, ContentDensity, NewsCategory } from '../../types';
import type { MarketState } from '../../features/markets/model';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { SearchableCurrencySelector } from './SearchableCurrencySelector';
import { formatDisplayDateTime } from '../../lib/formatting';

const NEWS_CATEGORIES: NewsCategory[] = ['Top', 'U.S.', 'Technology', 'World', 'Business', 'Science', 'Sports', 'Entertainment'];
const COMPANIES = [
  ['AAPL', 'Apple'], ['MSFT', 'Microsoft'], ['NVDA', 'NVIDIA'], ['AMZN', 'Amazon'],
  ['GOOGL', 'Alphabet'], ['META', 'Meta'],
] as const;
const FALLBACK_CURRENCIES: Record<string, string> = {
  USD: 'United States Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CHF: 'Swiss Franc', CNY: 'Chinese Renminbi Yuan',
  BDT: 'Bangladeshi Taka', INR: 'Indian Rupee', KRW: 'South Korean Won', SGD: 'Singapore Dollar',
};

const sectionClass = 'section-rule flex flex-col gap-3 pt-3 pb-1';
const titleClass = 'type-label font-semibold text-[color:var(--text-secondary)] flex items-center gap-1.5';
const toggleClass = 'tonal-section flex items-center justify-between text-xs text-[color:var(--text-secondary)] cursor-pointer p-2';

export function DisplaySettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const effectiveGlassIntensity = Math.min(Math.max(settings.glassIntensity, 0.5), 0.85);
  return <>
    <section className={sectionClass}>
      <h3 className={titleClass}><Monitor className="w-3.5 h-3.5" /> General Display</h3>
      <SegmentedSetting label="Temperature Unit" values={['fahrenheit', 'celsius']} value={settings.temperatureUnit} labels={['Fahrenheit (°F)', 'Celsius (°C)']} onChange={(temperatureUnit) => updateSettings({ temperatureUnit })} />
      <SegmentedSetting label="Time Format" values={['12h', '24h']} value={settings.timeFormat} labels={['12-Hour', '24-Hour']} onChange={(timeFormat) => updateSettings({ timeFormat })} />
    </section>
    <section className={sectionClass}>
      <h3 className={titleClass}><Sparkles className="w-3.5 h-3.5" /> Appearance &amp; Motion</h3>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-300">Background Motion</span>
        <div className="tonal-section grid grid-cols-3 gap-1 p-1">
          {(['living', 'subtle', 'static'] as BackgroundMotion[]).map((motion) => <button key={motion} type="button" onClick={() => updateSettings({ backgroundMotion: motion })} aria-pressed={settings.backgroundMotion === motion} className="compact-control py-1 text-xs font-semibold capitalize">{motion}</button>)}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-xs text-slate-300">
        <span className="flex justify-between">Glass opacity <span className="numeric semantic-info">{Math.round(effectiveGlassIntensity * 100)}%</span></span>
        <input type="range" min={0.5} max={0.85} step={0.05} value={effectiveGlassIntensity} onChange={(event) => updateSettings({ glassIntensity: Number(event.target.value) })} className="w-full accent-sky-300 h-1.5" />
      </label>
      <SegmentedSetting label="Content Density" values={['comfortable', 'compact'] as ContentDensity[]} value={settings.contentDensity} labels={['Comfortable', 'Compact']} onChange={(contentDensity) => updateSettings({ contentDensity })} />
      <ToggleRow label="Reduce motion" checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
    </section>
  </>;
}

export function ContentSettingsSection({ marketState, onRefreshMarkets }: { marketState: MarketState; onRefreshMarkets: () => void }) {
  const { settings, updateSettings } = useSettingsStore();
  const selectedCompanySymbols = settings.marketSymbols.filter((symbol) =>
    COMPANIES.some(([company]) => company === symbol),
  );
  const toggleCategory = (category: NewsCategory) => {
    const selected = settings.newsCategories.includes(category);
    if (selected && settings.newsCategories.length > 1) updateSettings({ newsCategories: settings.newsCategories.filter((item) => item !== category) });
    if (!selected && settings.newsCategories.length < 3) updateSettings({ newsCategories: [...settings.newsCategories, category] });
  };
  const toggleSymbol = (symbol: string) => {
    const selected = selectedCompanySymbols.includes(symbol);
    if (selected && selectedCompanySymbols.length > 1) updateSettings({ marketSymbols: selectedCompanySymbols.filter((item) => item !== symbol) });
    if (!selected && selectedCompanySymbols.length < 6) updateSettings({ marketSymbols: [...selectedCompanySymbols, symbol] });
  };
  return <>
    <section className={sectionClass}>
      <div className="flex justify-between"><h3 className={titleClass}><Newspaper className="w-3.5 h-3.5" /> News categories</h3><span className="type-metadata numeric text-[color:var(--text-muted)]">{settings.newsCategories.length} / 3 selected</span></div>
      <p className="type-metadata text-[color:var(--text-muted)]">Select up to 3 news topics for your main feed.</p>
      <div className="flex flex-wrap gap-1.5">{NEWS_CATEGORIES.map((category) => {
        const selected = settings.newsCategories.includes(category);
        const disabled = settings.newsCategories.length >= 3 && !selected;
        return <button key={category} type="button" disabled={disabled} onClick={() => toggleCategory(category)} aria-pressed={selected} className="compact-control inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium">{selected && <Check className="w-3 h-3" />}{category}</button>;
      })}</div>
    </section>
    <section className={sectionClass}>
      <h3 className={titleClass}><TrendingUp className="w-3.5 h-3.5" /> Markets</h3>
      <ToggleRow label="Show Markets panel" checked={settings.showMarkets} onChange={(showMarkets) => updateSettings({ showMarkets })} />
      {settings.showMarkets && <>
        <p className="type-metadata text-[color:var(--text-muted)]">S&amp;P 500 (SPY), Dow Jones (DIA), and Nasdaq-100 (QQQ) ETF proxies are always included.</p>
        <div className="flex justify-between text-xs text-slate-300"><span>Companies (max 6)</span><span className="font-mono text-slate-400">{selectedCompanySymbols.length} / 6</span></div>
        <div className="grid grid-cols-2 gap-1.5">{COMPANIES.map(([symbol, name]) => {
          const selected = selectedCompanySymbols.includes(symbol);
          return <button key={symbol} type="button" disabled={!selected && selectedCompanySymbols.length >= 6} onClick={() => toggleSymbol(symbol)} aria-pressed={selected} className="compact-control numeric flex justify-between px-2.5 py-1.5 text-xs"><span>{symbol}</span><span className="font-sans type-metadata">{name}</span></button>;
        })}</div>
        <div className="tonal-section flex items-center justify-between gap-3 p-2.5">
          <div className="min-w-0">
            <p className="type-metadata font-semibold text-[color:var(--text-secondary)]">Market snapshot</p>
            <p className="type-metadata truncate text-[color:var(--text-muted)]">{formatMarketSettingsStatus(marketState, settings.timeFormat, settings.activeLocation?.timezone)}</p>
          </div>
          <button type="button" onClick={onRefreshMarkets} disabled={marketState.status === 'loading'} className="compact-control flex shrink-0 items-center gap-1.5 px-2.5 py-1 type-metadata font-semibold">
            <RefreshCw className={`h-3.5 w-3.5 ${marketState.status === 'loading' ? 'animate-spin' : ''}`} />Check
          </button>
        </div>
      </>}
    </section>
  </>;
}

export function OptionalSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const { currencies } = useCurrencyStore();
  const [base, quote] = settings.currencyPair.split('/');
  const currencyData = Object.keys(currencies).length ? currencies : FALLBACK_CURRENCIES;
  const updateIslamic = (patch: Partial<typeof settings.islamic>) => updateSettings({ islamic: { ...settings.islamic, ...patch } });
  return <section className={sectionClass}>
    <h3 className={titleClass}><Compass className="w-3.5 h-3.5" /> Optional Information</h3>
    <ToggleRow label={<span className="flex gap-1.5"><DollarSign className="w-3.5 h-3.5 text-sky-400" />Show Currency Pair in Context Bar</span>} checked={settings.currencyEnabled} onChange={(currencyEnabled) => updateSettings({ currencyEnabled })} />
    {settings.currencyEnabled && <div className="grid grid-cols-2 gap-3 pl-2">
      <SearchableCurrencySelector label="Base" selected={base} exclude={quote} currencies={currencyData} onSelect={(next) => next !== quote && updateSettings({ currencyPair: `${next}/${quote}` })} />
      <SearchableCurrencySelector label="Quote" selected={quote} exclude={base} currencies={currencyData} onSelect={(next) => next !== base && updateSettings({ currencyPair: `${base}/${next}` })} />
    </div>}
    <h4 className="type-label flex items-center gap-1.5 font-semibold text-[color:var(--text-secondary)]"><Moon className="w-3.5 h-3.5 semantic-info" />Prayer Times &amp; Hijri Date</h4>
    <ToggleRow label="Enable prayer information" checked={settings.islamic.enabled} onChange={(enabled) => updateIslamic({ enabled })} />
    {settings.islamic.enabled && <div className="tonal-section flex flex-col gap-2 p-3">
      <ToggleRow label="Show Hijri date" checked={settings.islamic.showHijriDate} onChange={(showHijriDate) => updateIslamic({ showHijriDate })} compact />
      <ToggleRow label="Show full schedule" checked={settings.islamic.showFullSchedule} onChange={(showFullSchedule) => updateIslamic({ showFullSchedule })} compact />
      <SelectRow label="Calculation method" value={settings.islamic.calculationMethod} onChange={(calculationMethod) => updateIslamic({ calculationMethod })} options={[['ISNA', 'ISNA (North America)'], ['MWL', 'Muslim World League'], ['Egyptian', 'Egyptian General Authority'], ['Karachi', 'Karachi (Islamic Sciences)'], ['Makkah', 'Umm Al-Qura (Makkah)']]} />
      <SelectRow label="Asr method" value={settings.islamic.asrMethod} onChange={(asrMethod) => updateIslamic({ asrMethod })} options={[['Hanafi', 'Hanafi'], ['Standard', 'Standard (Shafi, Maliki, Hanbali)']]} />
    </div>}
  </section>;
}

export function ProviderSettingsSection({ marketState, onRefreshMarkets, onClearMarketCache }: { marketState: MarketState; onRefreshMarkets: () => void; onClearMarketCache: () => void }) {
  const { timeFormat, activeLocation } = useSettingsStore((state) => state.settings);
  return <section className={sectionClass}>
    <h3 className={titleClass}><ShieldCheck className="w-3.5 h-3.5" /> Market Data &amp; Privacy</h3>
    <p className="type-metadata text-[color:var(--text-muted)]">Market data is fetched by a scheduled GitHub Actions workflow using a private repository secret. The website downloads the latest generated snapshot and never receives the Finnhub API key.</p>
    <div className="tonal-section flex flex-col gap-2 p-3 type-metadata text-[color:var(--text-secondary)]">
      <div className="flex justify-between gap-3"><span>Provider</span><span className="font-semibold">Finnhub</span></div>
      <div className="flex justify-between gap-3"><span>Public snapshot</span><span className="font-semibold">{marketState.status === 'unavailable' ? 'Unavailable' : marketState.status === 'loading' ? 'Checking' : 'Valid'}</span></div>
      <div className="flex justify-between gap-3"><span>Browser data</span><span className="font-semibold">{marketState.status === 'cached' || marketState.status === 'stale' ? 'Cached' : marketState.status === 'unavailable' ? 'None' : 'Available'}</span></div>
      <div className="flex justify-between gap-3"><span>Generated</span><span className="numeric text-right font-semibold">{marketState.status === 'loaded' || marketState.status === 'cached' || marketState.status === 'stale' || marketState.status === 'partial' ? formatSnapshotDate(marketState.snapshot.generatedAt, timeFormat, activeLocation?.timezone) : 'Not available'}</span></div>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onRefreshMarkets} disabled={marketState.status === 'loading'} className="compact-control flex items-center gap-1.5 px-3 py-1 type-metadata font-semibold"><Database className="h-3.5 w-3.5" />Check latest snapshot</button>
      <button type="button" onClick={onClearMarketCache} className="compact-control flex items-center gap-1.5 px-3 py-1 type-metadata"><Trash2 className="h-3.5 w-3.5" />Clear local cache</button>
    </div>
  </section>;
}

function formatMarketSettingsStatus(state: MarketState, timeFormat: '12h' | '24h', timeZone?: string): string {
  if (state.status === 'loading') return 'Checking the published snapshot…';
  if (state.status === 'unavailable') return 'No valid published snapshot available';
  return `${state.status === 'loaded' ? 'Available' : state.status} · ${formatSnapshotDate(state.snapshot.generatedAt, timeFormat, timeZone)}`;
}

function formatSnapshotDate(value: string, timeFormat: '12h' | '24h', timeZone?: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Unknown';
  return formatDisplayDateTime(new Date(timestamp), { timeFormat, timeZone });
}

function ToggleRow({ label, checked, onChange, compact = false }: { label: React.ReactNode; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean }) {
  return <label className={compact ? 'flex items-center justify-between text-xs text-[color:var(--text-secondary)] cursor-pointer' : toggleClass}><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="w-4 h-4 rounded accent-sky-300" /></label>;
}

function SegmentedSetting<T extends string>({ label, values, labels, value, onChange }: { label: string; values: readonly T[]; labels: readonly string[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex justify-between items-center text-xs text-[color:var(--text-secondary)]"><span>{label}</span><div className="tonal-section flex p-0.5">{values.map((item, index) => <button type="button" key={item} onClick={() => onChange(item)} aria-pressed={value === item} className="compact-control px-3 py-1 text-xs font-semibold">{labels[index]}</button>)}</div></div>;
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <label className="flex justify-between items-center text-xs text-[color:var(--text-secondary)]"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="compact-control px-2 py-1 text-xs">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select></label>;
}
