import { useState } from 'react';
import { Check, Compass, DollarSign, Info, Key, Monitor, Moon, Newspaper, Sparkles, TrendingUp } from 'lucide-react';
import type { BackgroundMotion, ContentDensity, NewsCategory } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { getProviderUsage, testAlphaVantageKey, type KeyTestResult } from '../../features/markets/alphaVantageService';
import { SearchableCurrencySelector } from './SearchableCurrencySelector';

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

const sectionClass = 'flex flex-col gap-3 pt-3 border-t border-white/10';
const titleClass = 'text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5';
const toggleClass = 'flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/40 border border-white/5';

export function DisplaySettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
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
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-900/60 border border-white/10">
          {(['living', 'subtle', 'static'] as BackgroundMotion[]).map((motion) => <button key={motion} type="button" onClick={() => updateSettings({ backgroundMotion: motion })} className={`py-1 rounded text-xs font-bold uppercase tracking-wider ${settings.backgroundMotion === motion ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{motion}</button>)}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-xs text-slate-300">
        <span className="flex justify-between">Glass Opacity / Intensity <span className="font-mono text-indigo-300">{Math.round(settings.glassIntensity * 100)}%</span></span>
        <input type="range" min={0.2} max={0.9} step={0.05} value={settings.glassIntensity} onChange={(event) => updateSettings({ glassIntensity: Number(event.target.value) })} className="w-full accent-indigo-500 h-1.5" />
      </label>
      <SegmentedSetting label="Content Density" values={['comfortable', 'compact'] as ContentDensity[]} value={settings.contentDensity} labels={['Comfortable', 'Compact']} onChange={(contentDensity) => updateSettings({ contentDensity })} />
      <ToggleRow label="Reduce motion" checked={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
    </section>
  </>;
}

export function ContentSettingsSection() {
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
      <div className="flex justify-between"><h3 className={titleClass}><Newspaper className="w-3.5 h-3.5" /> News Categories</h3><span className="text-[11px] font-mono text-slate-400">{settings.newsCategories.length} / 3 selected</span></div>
      <p className="text-[11px] text-slate-400">Select up to 3 news topics for your main feed.</p>
      <div className="flex flex-wrap gap-1.5">{NEWS_CATEGORIES.map((category) => {
        const selected = settings.newsCategories.includes(category);
        const disabled = settings.newsCategories.length >= 3 && !selected;
        return <button key={category} type="button" disabled={disabled} onClick={() => toggleCategory(category)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${selected ? 'bg-indigo-600 text-white border-indigo-400/30' : 'bg-white/5 text-slate-300 border-white/10 disabled:opacity-50'}`}>{selected && <Check className="w-3 h-3" />}{category}</button>;
      })}</div>
    </section>
    <section className={sectionClass}>
      <h3 className={titleClass}><TrendingUp className="w-3.5 h-3.5" /> Markets</h3>
      <ToggleRow label="Show Markets panel" checked={settings.showMarkets} onChange={(showMarkets) => updateSettings({ showMarkets })} />
      {settings.showMarkets && <>
        <p className="text-[11px] text-slate-400">Keyless TradingView ticker. S&amp;P 500, Dow Jones, and Nasdaq indices are always included.</p>
        <div className="flex justify-between text-xs text-slate-300"><span>Companies (max 6)</span><span className="font-mono text-slate-400">{selectedCompanySymbols.length} / 6</span></div>
        <div className="grid grid-cols-2 gap-1.5">{COMPANIES.map(([symbol, name]) => {
          const selected = selectedCompanySymbols.includes(symbol);
          return <button key={symbol} type="button" disabled={!selected && selectedCompanySymbols.length >= 6} onClick={() => toggleSymbol(symbol)} className={`flex justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono border ${selected ? 'bg-indigo-950/80 text-indigo-200 border-indigo-500/50' : 'bg-white/5 text-slate-400 border-white/5 disabled:opacity-50'}`}><span>{symbol}</span><span className="font-sans text-[10px]">{name}</span></button>;
        })}</div>
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
    <ToggleRow label={<span className="flex gap-1.5"><Moon className="w-3.5 h-3.5 text-indigo-400" />Islamic Daylight / Prayer Times</span>} checked={settings.islamic.enabled} onChange={(enabled) => updateIslamic({ enabled })} />
    {settings.islamic.enabled && <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900/60 border border-white/10">
      <ToggleRow label="Show next prayer in Context Bar" checked={settings.islamic.showNextPrayer} onChange={(showNextPrayer) => updateIslamic({ showNextPrayer })} compact />
      <ToggleRow label="Show Hijri date in Context Bar" checked={settings.islamic.showHijriDate} onChange={(showHijriDate) => updateIslamic({ showHijriDate })} compact />
      <ToggleRow label="Show full prayer schedule" checked={settings.islamic.showFullSchedule} onChange={(showFullSchedule) => updateIslamic({ showFullSchedule })} compact />
      <SelectRow label="Calculation Method" value={settings.islamic.calculationMethod} onChange={(calculationMethod) => updateIslamic({ calculationMethod })} options={[['ISNA', 'ISNA (North America)'], ['MWL', 'Muslim World League'], ['Egyptian', 'Egyptian General Authority'], ['Karachi', 'Karachi (Islamic Sciences)'], ['Makkah', 'Umm Al-Qura (Makkah)']]} />
      <SelectRow label="Asr Juristic Method" value={settings.islamic.asrMethod} onChange={(asrMethod) => updateIslamic({ asrMethod })} options={[['Hanafi', 'Hanafi'], ['Standard', 'Standard (Shafi, Maliki, Hanbali)']]} />
    </div>}
  </section>;
}

export function ProviderSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<KeyTestResult | null>(null);
  const testKey = async () => {
    if (!settings.alphaVantageApiKey) return;
    setTesting(true); setResult(null);
    try { setResult(await testAlphaVantageKey(settings.alphaVantageApiKey)); }
    catch { setResult('network_error'); }
    finally { setTesting(false); }
  };
  return <section className={sectionClass}>
    <h3 className={titleClass}><Key className="w-3.5 h-3.5" /> Alpha Vantage Markets API Key</h3>
    <p className="text-[11px] text-slate-400">Optional advanced provider only; it is not used by or required for the default TradingView market display. Stored only in this browser and sent directly to Alpha Vantage when tested.</p>
    <div className="flex justify-between text-[11px] text-slate-300"><span>Personal API Key</span><span className="font-mono text-indigo-300">Usage today: {getProviderUsage().requestsAttempted} / 20 reqs</span></div>
    <div className="relative"><input type={showKey ? 'text' : 'password'} value={settings.alphaVantageApiKey ?? ''} onChange={(event) => updateSettings({ alphaVantageApiKey: event.target.value })} placeholder="Enter Alpha Vantage key..." className="w-full px-3 py-1.5 pr-16 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-indigo-300" /><button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1.5 text-[10px] text-slate-400">{showKey ? 'Hide' : 'Show'}</button></div>
    <div className="flex gap-2"><button type="button" disabled={testing || !settings.alphaVantageApiKey?.trim()} onClick={() => void testKey()} className="px-3 py-1 rounded bg-indigo-600 disabled:opacity-50 text-white text-[11px] font-semibold">{testing ? 'Testing...' : 'Test Key'}</button><button type="button" disabled={!settings.alphaVantageApiKey} onClick={() => { updateSettings({ alphaVantageApiKey: '' }); setResult(null); }} className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 text-slate-300 text-[11px]">Remove Key</button></div>
    {result && <div className={`flex gap-1.5 p-2 rounded text-[11px] ${result === 'valid' ? 'bg-emerald-950/60 text-emerald-300' : 'bg-amber-950/60 text-amber-300'}`}><Info className="w-3.5 h-3.5" />Test result: {result.replaceAll('_', ' ')}</div>}
  </section>;
}

function ToggleRow({ label, checked, onChange, compact = false }: { label: React.ReactNode; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean }) {
  return <label className={compact ? 'flex items-center justify-between text-xs text-slate-300 cursor-pointer' : toggleClass}><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="w-4 h-4 rounded accent-indigo-500" /></label>;
}

function SegmentedSetting<T extends string>({ label, values, labels, value, onChange }: { label: string; values: readonly T[]; labels: readonly string[]; value: T; onChange: (value: T) => void }) {
  return <div className="flex justify-between items-center text-xs text-slate-300"><span>{label}</span><div className="flex rounded-lg bg-slate-900/60 p-0.5 border border-white/10">{values.map((item, index) => <button type="button" key={item} onClick={() => onChange(item)} className={`px-3 py-1 rounded-md text-xs font-semibold ${value === item ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{labels[index]}</button>)}</div></div>;
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <label className="flex justify-between items-center text-xs text-slate-300"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-xs text-slate-200">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select></label>;
}
