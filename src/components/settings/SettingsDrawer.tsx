import React, { useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  Monitor,
  Newspaper,
  TrendingUp,
  Sparkles,
  Info,
  RotateCcw,
  Check,
  Compass,
  DollarSign,
  Moon,
  Key,
} from 'lucide-react';
import { useSettingsStore } from '../../lib/stores/useSettingsStore';
import { NewsCategory, BackgroundMotion, ContentDensity } from '../../lib/types';
import { LocationSettingsSection } from './LocationSettingsSection';
import { useCurrencyStore } from '../../lib/stores/useCurrencyStore';
import { SearchableCurrencySelector } from './SearchableCurrencySelector';
import { testAlphaVantageKey, getProviderUsage, KeyTestResult } from '../../features/markets/alphaVantageService';

const DEFAULT_FALLBACK_CURRENCIES: Record<string, string> = {
  USD: 'United States Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Renminbi Yuan',
  SEK: 'Swedish Krona',
  NZD: 'New Zealand Dollar',
  SGD: 'Singapore Dollar',
  THB: 'Thai Baht',
  TRY: 'Turkish Lira',
  ZAR: 'South African Rand',
  BRL: 'Brazilian Real',
  HKD: 'Hong Kong Dollar',
  MXN: 'Mexican Peso',
  INR: 'Indian Rupee',
  KRW: 'South Korean Won',
  PHP: 'Philippine Peso',
};


interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

const ALL_NEWS_CATEGORIES: NewsCategory[] = [
  'Top',
  'U.S.',
  'Technology',
  'World',
  'Business',
  'Science',
  'Sports',
  'Entertainment',
];

const ALL_COMPANIES = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NFLX', name: 'Netflix' },
];

const CURRENCY_PAIRS = ['USD/BDT', 'USD/EUR', 'USD/GBP', 'USD/JPY', 'USD/CAD'];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, triggerRef }) => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { currencies, fetchCurrencies } = useCurrencyStore();

  const [showAvKey, setShowAvKey] = React.useState(false);
  const [isTestingAvKey, setIsTestingAvKey] = React.useState(false);
  const [avKeyTestResult, setAvKeyTestResult] = React.useState<KeyTestResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCurrencies();
    }
  }, [isOpen, fetchCurrencies]);


  // Lock body scroll and set up Escape key + Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial element in drawer
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Escape key handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Simple focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);

      // Return focus to trigger button
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Toggle News Category handler (Max 3)
  const handleToggleNewsCategory = (category: NewsCategory) => {
    const current = settings.newsCategories;
    if (current.includes(category)) {
      // Remove
      if (current.length > 1) {
        updateSettings({ newsCategories: current.filter((c) => c !== category) });
      }
    } else {
      // Add if < 3
      if (current.length < 3) {
        updateSettings({ newsCategories: [...current, category] });
      }
    }
  };

  // Toggle Market Symbol handler (Max 6)
  const handleToggleMarketSymbol = (symbol: string) => {
    const current = settings.marketSymbols;
    if (current.includes(symbol)) {
      if (current.length > 1) {
        updateSettings({ marketSymbols: current.filter((s) => s !== symbol) });
      }
    } else {
      if (current.length < 6) {
        updateSettings({ marketSymbols: [...current, symbol] });
      }
    }
  };

  const isReducedMotion = settings.reducedMotion;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-drawer-title"
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
      />

      {/* Drawer Container */}
      <aside { ...{ ref: drawerRef } }
        className={`relative z-50 w-full max-w-full sm:max-w-[400px] 2xl:max-w-[440px] h-full bg-[#0f172a]/95 text-slate-100 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar p-6 backdrop-blur-2xl ${
          isReducedMotion ? '' : 'transition-transform duration-300 ease-out translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              <div>
                <h2 id="settings-drawer-title" className="text-lg font-bold tracking-tight">
                  Preferences
                </h2>
                <p className="text-xs text-slate-400">Customize Ambient Brief dashboard</p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close preferences drawer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SECTION 1: LOCATION */}
          <LocationSettingsSection />

          {/* SECTION 2: GENERAL FORMATS */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" /> General Display
            </h3>

            {/* Temperature Unit */}
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Temperature Unit</span>
              <div className="flex rounded-lg bg-slate-900/60 p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => updateSettings({ temperatureUnit: 'fahrenheit' })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    settings.temperatureUnit === 'fahrenheit'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ temperatureUnit: 'celsius' })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    settings.temperatureUnit === 'celsius'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Celsius (°C)
                </button>
              </div>
            </div>

            {/* Time Format */}
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Time Format</span>
              <div className="flex rounded-lg bg-slate-900/60 p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => updateSettings({ timeFormat: '12h' })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    settings.timeFormat === '12h'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  12-Hour
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ timeFormat: '24h' })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    settings.timeFormat === '24h'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  24-Hour
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 2: NEWS */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" /> News Categories
              </h3>
              <span className="text-[11px] font-mono font-semibold text-slate-400">
                {settings.newsCategories.length} / 3 selected
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Select up to 3 news topics for your main feed.
            </p>

            {/* Categories Chips */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_NEWS_CATEGORIES.map((cat) => {
                const isSelected = settings.newsCategories.includes(cat);
                const isMax = settings.newsCategories.length >= 3 && !isSelected;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleNewsCategory(cat)}
                    disabled={isMax}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border border-indigo-400/30'
                        : isMax
                        ? 'bg-white/5 text-slate-500 border border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {settings.newsCategories.length >= 3 && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Maximum 3 categories selected. Remove a category before adding another.
                </span>
              </div>
            )}
          </section>

          {/* SECTION 3: MARKETS */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Markets
              </h3>
            </div>

            {/* Show Markets Toggle */}
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <span>Show Markets panel</span>
              <input
                type="checkbox"
                checked={settings.showMarkets}
                onChange={(e) => updateSettings({ showMarkets: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-500 bg-white/10 border-white/20"
              />
            </label>

            {settings.showMarkets && (
              <>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-slate-300">
                    Companies (max 6)
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {settings.marketSymbols.length} / 6
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_COMPANIES.map((company) => {
                    const isSelected = settings.marketSymbols.includes(company.symbol);
                    const isMax = settings.marketSymbols.length >= 6 && !isSelected;

                    return (
                      <button
                        key={company.symbol}
                        type="button"
                        onClick={() => handleToggleMarketSymbol(company.symbol)}
                        disabled={isMax}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-500/50'
                            : isMax
                            ? 'bg-white/5 text-slate-600 border border-white/5 opacity-50 cursor-not-allowed'
                            : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                          <span>{company.symbol}</span>
                        </div>
                        <span className="text-[10px] font-sans font-normal text-slate-400">
                          {company.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {settings.marketSymbols.length >= 6 && (
                  <div className="flex items-start gap-1.5 p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200">
                    <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      Maximum 6 companies selected. Remove a company to add another.
                    </span>
                  </div>
                )}

                {/* Show Sparklines Toggle */}
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/40 border border-white/5">
                  <span>Show sparkline mini graphs</span>
                  <input
                    type="checkbox"
                    checked={settings.showSparklines}
                    onChange={(e) => updateSettings({ showSparklines: e.target.checked })}
                    className="w-4 h-4 rounded accent-indigo-500 bg-white/10 border-white/20"
                  />
                </label>
              </>
            )}
          </section>

          {/* SECTION 4: APPEARANCE */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Appearance &amp; Motion
            </h3>

            {/* Background Motion */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300">Background Motion</span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-900/60 border border-white/10 text-center">
                {(['living', 'subtle', 'static'] as BackgroundMotion[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateSettings({ backgroundMotion: m })}
                    className={`py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      settings.backgroundMotion === m
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Glass Intensity Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Glass Opacity / Intensity</span>
                <span className="font-mono text-indigo-300 font-semibold">
                  {Math.round(settings.glassIntensity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.9}
                step={0.05}
                value={settings.glassIntensity}
                onChange={(e) => updateSettings({ glassIntensity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 bg-white/10 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Content Density */}
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Content Density</span>
              <div className="flex rounded-lg bg-slate-900/60 p-0.5 border border-white/10">
                {(['comfortable', 'compact'] as ContentDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateSettings({ contentDensity: d })}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                      settings.contentDensity === d
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Reduced Motion Toggle */}
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <span>Reduce motion</span>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-500 bg-white/10 border-white/20"
              />
            </label>
          </section>

          {/* SECTION 5: OPTIONAL INFORMATION */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Optional Information
            </h3>

            {/* Currency Pair Toggle */}
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-sky-400" />
                <span>Show Currency Pair in Context Bar</span>
              </div>
              <input
                type="checkbox"
                checked={settings.currencyEnabled}
                onChange={(e) => updateSettings({ currencyEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-500 bg-white/10 border-white/20"
              />
            </label>

            {settings.currencyEnabled && (
              <div className="flex flex-col gap-3 pl-2">
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const [base, quote] = (settings.currencyPair || 'USD/BDT').split('/');
                    const currencyData = Object.keys(currencies).length > 0 ? currencies : DEFAULT_FALLBACK_CURRENCIES;
                    return (
                      <>
                        <SearchableCurrencySelector
                          label="Base"
                          selected={base}
                          exclude={quote}
                          onSelect={(newBase) => {
                            if (newBase !== quote) {
                              updateSettings({ currencyPair: `${newBase}/${quote}` });
                            }
                          }}
                          currencies={currencyData}
                        />
                        <SearchableCurrencySelector
                          label="Quote"
                          selected={quote}
                          exclude={base}
                          onSelect={(newQuote) => {
                            if (base !== newQuote) {
                              updateSettings({ currencyPair: `${base}/${newQuote}` });
                            }
                          }}
                          currencies={currencyData}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Islamic Information Toggle */}
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <div className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Islamic Daylight / Prayer Times</span>
              </div>
              <input
                type="checkbox"
                checked={settings.islamic.enabled}
                onChange={(e) =>
                  updateSettings({
                    islamic: { ...settings.islamic, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded accent-indigo-500 bg-white/10 border-white/20"
              />
            </label>

            {/* Revealed Islamic options */}
            {settings.islamic.enabled && (
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900/60 border border-white/10 pl-3">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show next prayer in Context Bar</span>
                  <input
                    type="checkbox"
                    checked={settings.islamic.showNextPrayer}
                    onChange={(e) =>
                      updateSettings({
                        islamic: { ...settings.islamic, showNextPrayer: e.target.checked },
                      })
                    }
                    className="w-3.5 h-3.5 rounded accent-indigo-500 bg-white/10 border-white/20"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Hijri date in Context Bar</span>
                  <input
                    type="checkbox"
                    checked={settings.islamic.showHijriDate}
                    onChange={(e) =>
                      updateSettings({
                        islamic: { ...settings.islamic, showHijriDate: e.target.checked },
                      })
                    }
                    className="w-3.5 h-3.5 rounded accent-indigo-500 bg-white/10 border-white/20"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show full prayer schedule</span>
                  <input
                    type="checkbox"
                    checked={settings.islamic.showFullSchedule}
                    onChange={(e) =>
                      updateSettings({
                        islamic: { ...settings.islamic, showFullSchedule: e.target.checked },
                      })
                    }
                    className="w-3.5 h-3.5 rounded accent-indigo-500 bg-white/10 border-white/20"
                  />
                </label>

                <div className="flex justify-between items-center text-xs text-slate-300 pt-1">
                  <span>Calculation Method</span>
                  <select
                    value={settings.islamic.calculationMethod}
                    onChange={(e) =>
                      updateSettings({
                        islamic: { ...settings.islamic, calculationMethod: e.target.value },
                      })
                    }
                    className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-xs text-slate-200"
                  >
                    <option value="ISNA">ISNA (North America)</option>
                    <option value="MWL">Muslim World League</option>
                    <option value="Egyptian">Egyptian General Authority</option>
                    <option value="Karachi">Karachi (Islamic Sciences)</option>
                    <option value="Makkah">Umm Al-Qura (Makkah)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Asr Juristic Method</span>
                  <select
                    value={settings.islamic.asrMethod}
                    onChange={(e) =>
                      updateSettings({
                        islamic: { ...settings.islamic, asrMethod: e.target.value },
                      })
                    }
                    className="px-2 py-1 rounded bg-slate-900 border border-white/10 text-xs text-slate-200"
                  >
                    <option value="Hanafi">Hanafi</option>
                    <option value="Standard">Standard (Shafi, Maliki, Hanbali)</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 6: API KEY CONFIGURATIONS */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Alpha Vantage Markets API Key
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              Configure your personal Alpha Vantage API key to fetch end-of-day market data for ETF proxies and your symbol watchlist.
            </p>

            <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-0.5 bg-slate-900/40 p-2 rounded-lg border border-white/5">
              <li>Stored only in this browser (localStorage)</li>
              <li>Sent directly to Alpha Vantage</li>
              <li>No backend / server proxy</li>
              <li>Not safe for a valuable private secret</li>
              <li>Subject to the user&apos;s own provider quota</li>
            </ul>

            {/* Alpha Vantage key input with show/hide */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                <span>Personal API Key</span>
                {(() => {
                  const usage = getProviderUsage();
                  return (
                    <span className="text-[10px] font-mono text-indigo-300">
                      Usage today: {usage.requestsAttempted} / 20 reqs
                    </span>
                  );
                })()}
              </div>

              <div className="relative flex items-center">
                <input
                  type={showAvKey ? 'text' : 'password'}
                  placeholder="Enter Alpha Vantage key..."
                  value={settings.alphaVantageApiKey || ''}
                  onChange={(e) => updateSettings({ alphaVantageApiKey: e.target.value })}
                  className="w-full px-3 py-1.5 pr-16 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowAvKey(!showAvKey)}
                  className="absolute right-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded"
                >
                  {showAvKey ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Action buttons: Test & Remove */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  disabled={isTestingAvKey || !settings.alphaVantageApiKey?.trim()}
                  onClick={async () => {
                    setIsTestingAvKey(true);
                    setAvKeyTestResult(null);
                    try {
                      const res = await testAlphaVantageKey(settings.alphaVantageApiKey!);
                      setAvKeyTestResult(res);
                    } catch {
                      setAvKeyTestResult('network_error');
                    } finally {
                      setIsTestingAvKey(false);
                    }
                  }}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  {isTestingAvKey ? 'Testing...' : 'Test Key'}
                </button>

                <button
                  type="button"
                  disabled={!settings.alphaVantageApiKey}
                  onClick={() => {
                    updateSettings({ alphaVantageApiKey: '' });
                    setAvKeyTestResult(null);
                  }}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 text-[11px] font-semibold transition-colors"
                >
                  Remove Key
                </button>
              </div>

              {/* Test result feedback */}
              {avKeyTestResult && (
                <div
                  className={`flex items-center gap-1.5 p-2 rounded text-[11px] mt-1 ${
                    avKeyTestResult === 'valid'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Test Result:{' '}
                    {avKeyTestResult === 'valid' && 'Valid API Key (SPY quote successful)'}
                    {avKeyTestResult === 'invalid' && 'Invalid API Key or unauthorized'}
                    {avKeyTestResult === 'rate_limited' && 'Rate Limited (Frequency threshold reached)'}
                    {avKeyTestResult === 'quota_exhausted' && 'Daily Quota Exhausted'}
                    {avKeyTestResult === 'network_error' && 'Network problem communicating with Alpha Vantage'}
                    {avKeyTestResult === 'blocked' && 'Browser access blocked (CORS / network restriction)'}
                    {avKeyTestResult === 'unknown' && 'Unknown provider response error'}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* SECTION: DEMO MODE */}
          <section className="flex flex-col gap-3 pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Demo Data Mode
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              Explicitly enable demo data mode to preview Ambient Brief using simulated sample briefs and data across all domains.
            </p>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-900/60 p-3 rounded-lg border border-amber-500/30">
              <span className="font-medium text-amber-200">Enable Demo Data Mode</span>
              <input
                type="checkbox"
                checked={settings.isDemoMode || false}
                onChange={(e) => updateSettings({ isDemoMode: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500 bg-white/10 border-white/20"
              />
            </label>
          </section>

          {/* DATA ATTRIBUTION */}
          <section className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-2.5">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Info className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span>Data Sources &amp; Attribution</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Ambient Brief integrates the following official data providers and APIs:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
              <li><strong className="text-slate-200">Open-Meteo</strong>: Weather forecasts, hourly timeline, air quality, and location geocoding.</li>
              <li><strong className="text-slate-200">National Weather Service (NWS)</strong>: Official real-time severe weather warnings and advisories (US).</li>
              <li><strong className="text-slate-200">GDELT &amp; The Guardian</strong>: Global news headlines, summaries, and categorized stories.</li>
              <li><strong className="text-slate-200">Frankfurter API</strong>: Real-time currency exchange rates and conversion data.</li>
              <li><strong className="text-slate-200">AlAdhan API</strong>: Accurate Islamic prayer schedules, daylight timings, and Hijri calendar dates.</li>
              <li><strong className="text-slate-200">Alpha Vantage</strong>: End-of-day market indices and company stock quotes.</li>
            </ul>
          </section>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-3 mt-6">
          <button
            type="button"
            onClick={resetSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30"
          >
            Apply &amp; Close
          </button>
        </div>
      </aside>
    </div>
  );
};
