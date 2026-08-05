import {
  Check,
  ChevronDown,
  Database,
  DollarSign,
  ExternalLink,
  Moon,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { BackgroundMotion, ContentDensity, NewsCategory } from '../../types';
import type { MarketState } from '../../features/markets/model';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { cacheService } from '../../lib/api/cacheService';
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

const groupClass = 'settings-group';

export function GeneralSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
  return <div className="settings-section-stack">
    <section className={groupClass} aria-labelledby="time-units-heading">
      <SectionHeading id="time-units-heading" title="Time and units" description="Choose how everyday measurements appear." />
      <SegmentedSetting label="Temperature" values={['fahrenheit', 'celsius']} value={settings.temperatureUnit} labels={['Fahrenheit', 'Celsius']} onChange={(temperatureUnit) => updateSettings({ temperatureUnit })} />
      <SegmentedSetting label="Time" values={['12h', '24h']} value={settings.timeFormat} labels={['12-hour', '24-hour']} onChange={(timeFormat) => updateSettings({ timeFormat })} />
    </section>
  </div>;
}

export function AppearanceSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const glassIntensity = Math.min(Math.max(settings.glassIntensity, 0.5), 0.85);
  return <div className="settings-section-stack">
    <section className={groupClass} aria-labelledby="motion-heading">
      <SectionHeading id="motion-heading" title="Atmosphere" description="Tune the dashboard without overpowering its content." />
      <SegmentedSetting label="Background motion" values={['living', 'subtle', 'static'] as BackgroundMotion[]} value={settings.backgroundMotion} labels={['Living', 'Subtle', 'Static']} onChange={(backgroundMotion) => updateSettings({ backgroundMotion })} stacked />
      <label className="settings-field">
        <span className="settings-field-label">Glass intensity <span className="settings-value">{Math.round(glassIntensity * 100)}%</span></span>
        <input aria-describedby="glass-intensity-help" type="range" min={0.5} max={0.85} step={0.05} value={glassIntensity} onChange={(event) => updateSettings({ glassIntensity: Number(event.target.value) })} />
        <span id="glass-intensity-help" className="settings-helper">Higher values make panels more opaque.</span>
      </label>
      <SegmentedSetting label="Content density" values={['comfortable', 'compact'] as ContentDensity[]} value={settings.contentDensity} labels={['Comfortable', 'Compact']} onChange={(contentDensity) => updateSettings({ contentDensity })} />
      <Switch label="Reduced motion" description="Minimizes decorative movement and transitions." checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
    </section>
  </div>;
}

export function ContentSettingsSection({ marketState, onRefreshMarkets, onConfigureProvider }: { marketState: MarketState; onRefreshMarkets: () => void; onConfigureProvider: () => void }) {
  const { settings, updateSettings } = useSettingsStore();
  const selectedSymbols = settings.marketSymbols.filter((symbol) => COMPANIES.some(([company]) => company === symbol));
  const toggleCategory = (category: NewsCategory) => {
    const selected = settings.newsCategories.includes(category);
    if (selected && settings.newsCategories.length > 1) updateSettings({ newsCategories: settings.newsCategories.filter((item) => item !== category) });
    if (!selected && settings.newsCategories.length < 3) updateSettings({ newsCategories: [...settings.newsCategories, category] });
  };
  const toggleSymbol = (symbol: string) => {
    const selected = selectedSymbols.includes(symbol);
    if (selected && selectedSymbols.length > 1) updateSettings({ marketSymbols: selectedSymbols.filter((item) => item !== symbol) });
    if (!selected && selectedSymbols.length < 6) updateSettings({ marketSymbols: [...selectedSymbols, symbol] });
  };

  return <div className="settings-section-stack">
    <section className={groupClass} aria-labelledby="news-heading">
      <SectionHeading id="news-heading" title="News" aside={`${settings.newsCategories.length} of 3 selected`} />
      <div className="settings-choice-grid settings-choice-grid--categories">
        {NEWS_CATEGORIES.map((category) => {
          const selected = settings.newsCategories.includes(category);
          return <button key={category} type="button" disabled={settings.newsCategories.length >= 3 && !selected} onClick={() => toggleCategory(category)} aria-pressed={selected} className="compact-control settings-choice">
            {selected && <Check aria-hidden="true" />}<span>{category}</span>
          </button>;
        })}
      </div>
      <p className="settings-helper">Choose one to three topics for the main feed.</p>
    </section>

    <section className={groupClass} aria-labelledby="markets-heading">
      <SectionHeading id="markets-heading" title="Markets" />
      <Switch label="Market panel" description="Show index proxies and your selected companies." checked={settings.showMarkets} onChange={(showMarkets) => updateSettings({ showMarkets })} />
      {settings.showMarkets && <div className="settings-disclosure" data-testid="market-options">
        <div className="settings-field-label"><span>Displayed companies</span><span className="settings-value">{selectedSymbols.length} selected</span></div>
        <div className="settings-choice-grid">
          {COMPANIES.map(([symbol, name]) => {
            const selected = selectedSymbols.includes(symbol);
            return <button key={symbol} type="button" disabled={!selected && selectedSymbols.length >= 6} onClick={() => toggleSymbol(symbol)} aria-pressed={selected} className="compact-control settings-company-choice">
              <span className="tabular-data">{symbol}</span><span>{name}</span>
            </button>;
          })}
        </div>
        <div className="provider-status" role="status">
          <span className={`provider-status-dot provider-status-dot--${marketStatusTone(marketState)}`} aria-hidden="true" />
          <div><strong>Finnhub snapshot</strong><span>{formatMarketSettingsStatus(marketState, settings.timeFormat, settings.activeLocation?.timezone)}</span></div>
          <button type="button" onClick={onRefreshMarkets} disabled={marketState.status === 'loading'} className="compact-control provider-check" aria-label="Check market provider status">
            <RefreshCw aria-hidden="true" className={marketState.status === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
        <button type="button" onClick={onConfigureProvider} className="settings-link-button">Configure provider <ExternalLink aria-hidden="true" /></button>
      </div>}
    </section>
  </div>;
}

export function OptionalSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const { currencies } = useCurrencyStore();
  const [base, quote] = settings.currencyPair.split('/');
  const currencyData = Object.keys(currencies).length ? currencies : FALLBACK_CURRENCIES;
  const updateIslamic = (patch: Partial<typeof settings.islamic>) => updateSettings({ islamic: { ...settings.islamic, ...patch } });

  return <div className="settings-section-stack">
    <section className={groupClass} aria-labelledby="currency-heading">
      <SectionHeading id="currency-heading" title="Currency" />
      <Switch label="Currency reference" description="Show a reference exchange rate in the context rail." checked={settings.currencyEnabled} onChange={(currencyEnabled) => updateSettings({ currencyEnabled })} icon={<DollarSign aria-hidden="true" />} />
      {settings.currencyEnabled && <div className="settings-disclosure settings-currency-grid" data-testid="currency-options">
        <SearchableCurrencySelector label="Base" selected={base} exclude={quote} currencies={currencyData} onSelect={(next) => next !== quote && updateSettings({ currencyPair: `${next}/${quote}` })} />
        <SearchableCurrencySelector label="Quote" selected={quote} exclude={base} currencies={currencyData} onSelect={(next) => next !== base && updateSettings({ currencyPair: `${base}/${next}` })} />
      </div>}
    </section>

    <section className={groupClass} aria-labelledby="prayer-heading">
      <SectionHeading id="prayer-heading" title="Prayer times and Hijri date" />
      <Switch label="Prayer information" description="Show the next prayer in the context rail." checked={settings.islamic.enabled} onChange={(enabled) => updateIslamic({ enabled })} icon={<Moon aria-hidden="true" />} />
      {settings.islamic.enabled && <div className="settings-disclosure" data-testid="prayer-options">
        <Switch label="Hijri date" checked={settings.islamic.showHijriDate} onChange={(showHijriDate) => updateIslamic({ showHijriDate })} compact />
        <Switch label="Full schedule" checked={settings.islamic.showFullSchedule} onChange={(showFullSchedule) => updateIslamic({ showFullSchedule })} compact />
        <SelectRow label="Calculation method" value={settings.islamic.calculationMethod} onChange={(calculationMethod) => updateIslamic({ calculationMethod })} options={[['ISNA', 'ISNA (North America)'], ['MWL', 'Muslim World League'], ['Egyptian', 'Egyptian General Authority'], ['Karachi', 'Karachi (Islamic Sciences)'], ['Makkah', 'Umm Al-Qura (Makkah)']]} />
        <SelectRow label="Asr method" value={settings.islamic.asrMethod} onChange={(asrMethod) => updateIslamic({ asrMethod })} options={[['Hanafi', 'Hanafi'], ['Standard', 'Standard (Shafi, Maliki, Hanbali)']]} />
      </div>}
    </section>
  </div>;
}

const SOURCES = [
  ['Weather', 'Open-Meteo', 'Current conditions, hourly forecast and geocoding.'],
  ['Alerts', 'National Weather Service', 'Official U.S. weather alerts when available.'],
  ['News', 'Currents', 'A scheduled, curated news snapshot.'],
  ['Markets', 'Finnhub', 'A scheduled snapshot when the provider is configured.'],
  ['Currency', 'Frankfurter', 'Reference exchange rates.'],
  ['Prayer times', 'AlAdhan', 'Prayer schedule and Hijri calendar information.'],
] as const;

export function DataPrivacySettingsSection({ marketState, onClearMarketCache, onConfigureProvider }: { marketState: MarketState; onClearMarketCache: () => void; onConfigureProvider: () => void }) {
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const clearCachedData = () => {
    cacheService.clearAll();
    onClearMarketCache();
  };
  return <div className="settings-section-stack">
    <section className={groupClass} aria-labelledby="sources-heading">
      <SectionHeading id="sources-heading" title="Data sources" description="Ambient Brief identifies live, cached, stale and unavailable data in the dashboard." />
      <div className="source-list">
        {SOURCES.map(([feature, provider, detail]) => <details key={feature}>
          <summary><span>{feature}</span><span>{provider}</span><ChevronDown aria-hidden="true" /></summary>
          <p>{detail}</p>
        </details>)}
      </div>
    </section>

    <section className={groupClass} aria-labelledby="privacy-heading">
      <SectionHeading id="privacy-heading" title="Data and privacy" />
      <div className="privacy-note"><ShieldCheck aria-hidden="true" /><p>Preferences and cached responses stay in this browser. Device location is requested only when you choose it. Provider secrets are not stored in the app.</p></div>
      <div className="settings-actions-row">
        <button type="button" onClick={clearCachedData} className="compact-control"><Trash2 aria-hidden="true" />Clear cached data</button>
        <button type="button" onClick={onConfigureProvider} className="compact-control"><Database aria-hidden="true" />Provider keys</button>
      </div>
      <p className="settings-helper">Market cache: {marketState.status === 'cached' || marketState.status === 'stale' ? marketState.status : marketState.status === 'unavailable' ? 'empty' : 'available'}.</p>
    </section>

    <section className={groupClass} aria-labelledby="reset-heading">
      <SectionHeading id="reset-heading" title="Reset" description="Return display, content and optional modules to their original settings." />
      <button type="button" onClick={resetSettings} className="compact-control settings-danger-action">Reset to defaults</button>
      <p className="settings-version">Ambient Brief 0.0.0 · Settings schema 2</p>
    </section>
  </div>;
}

/** Read-only provider summary retained as a small reusable surface for diagnostics and tests. */
export function ProviderSettingsSection({ marketState, onRefreshMarkets, onClearMarketCache }: { marketState: MarketState; onRefreshMarkets: () => void; onClearMarketCache: () => void }) {
  return <section className={groupClass} aria-labelledby="provider-summary-heading">
    <SectionHeading id="provider-summary-heading" title="Finnhub provider" />
    <p className="settings-helper">The Finnhub key is managed as a private repository secret. The browser downloads only a scheduled, validated snapshot and never stores the credential.</p>
    <div className="provider-status" role="status"><span className={`provider-status-dot provider-status-dot--${marketStatusTone(marketState)}`} aria-hidden="true" /><div><strong>Connection</strong><span>{marketState.status}</span></div></div>
    <div className="settings-actions-row"><button type="button" onClick={onRefreshMarkets} className="compact-control">Check connection</button><button type="button" onClick={onClearMarketCache} className="compact-control">Clear market cache</button></div>
  </section>;
}

function SectionHeading({ id, title, description, aside }: { id: string; title: string; description?: string; aside?: string }) {
  return <div className="settings-group-heading"><div><h3 id={id}>{title}</h3>{description && <p>{description}</p>}</div>{aside && <span>{aside}</span>}</div>;
}

function Switch({ label, description, checked, onChange, compact = false, icon }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean; icon?: React.ReactNode }) {
  return <label className={`settings-switch-row ${compact ? 'settings-switch-row--compact' : ''}`}>
    <span className="settings-switch-copy">{icon}<span><strong>{label}</strong>{description && <small>{description}</small>}</span></span>
    <input className="settings-switch-input" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>;
}

function SegmentedSetting<T extends string>({ label, values, labels, value, onChange, stacked = false }: { label: string; values: readonly T[]; labels: readonly string[]; value: T; onChange: (value: T) => void; stacked?: boolean }) {
  return <div className={`settings-segmented-field ${stacked ? 'settings-segmented-field--stacked' : ''}`}><span>{label}</span><div className="settings-segments">{values.map((item, index) => <button type="button" key={item} onClick={() => onChange(item)} aria-pressed={value === item} className="compact-control">{labels[index]}</button>)}</div></div>;
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <label className="settings-select-row"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="compact-control">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select></label>;
}

function formatMarketSettingsStatus(state: MarketState, timeFormat: '12h' | '24h', timeZone?: string): string {
  if (state.status === 'loading') return 'Checking published snapshot…';
  if (state.status === 'unavailable') return 'Not configured or unavailable';
  return `${state.status === 'loaded' ? 'Connected' : state.status} · ${formatSnapshotDate(state.snapshot.generatedAt, timeFormat, timeZone)}`;
}

function formatSnapshotDate(value: string, timeFormat: '12h' | '24h', timeZone?: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Unknown';
  return formatDisplayDateTime(new Date(timestamp), { timeFormat, timeZone });
}

function marketStatusTone(state: MarketState): 'ok' | 'warn' | 'off' {
  if (state.status === 'loaded' || state.status === 'cached') return 'ok';
  if (state.status === 'stale' || state.status === 'partial' || state.status === 'loading') return 'warn';
  return 'off';
}
