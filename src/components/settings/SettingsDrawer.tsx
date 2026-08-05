import { useEffect, useRef } from 'react';
import { Info, RotateCcw, Sliders, Sparkles, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { LocationSettingsSection } from './LocationSettingsSection';
import { ContentSettingsSection, DisplaySettingsSection, OptionalSettingsSection, ProviderSettingsSection } from './SettingsSections';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function SettingsDrawer({ isOpen, onClose, triggerRef }: SettingsDrawerProps) {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { fetchCurrencies } = useCurrencyStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (isOpen) void fetchCurrencies(); }, [fetchCurrencies, isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const trigger = triggerRef?.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const elements = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = originalOverflow; window.removeEventListener('keydown', handleKeyDown); trigger?.focus(); };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
    <aside ref={drawerRef} data-variant="secondary" className={`settings-drawer glass-panel relative z-[70] h-full min-h-0 w-full overflow-x-hidden overflow-y-auto sm:max-w-[400px] 2xl:max-w-[440px] rounded-none flex flex-col justify-between p-6 ${settings.reducedMotion ? '' : 'transition-transform duration-300 ease-out'}`}>
      <div className="flex flex-col gap-6">
        <header className="section-rule flex items-center justify-between pb-4"><div className="flex gap-2"><Sliders className="w-5 h-5 semantic-info" /><div><h2 id="settings-drawer-title" className="text-lg font-semibold">Preferences</h2><p className="text-xs text-[color:var(--text-muted)]">Customize Ambient Brief</p></div></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close preferences drawer" className="compact-control p-1.5"><X className="w-5 h-5" /></button></header>
        <LocationSettingsSection />
        <DisplaySettingsSection />
        <ContentSettingsSection />
        <OptionalSettingsSection />
        <ProviderSettingsSection />
        {import.meta.env.DEV && <section className="flex flex-col gap-3 pt-3 border-t border-white/10"><h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Demo Data Mode</h3><label className="flex justify-between text-xs bg-slate-900/60 p-3 rounded-lg border border-amber-500/30"><span className="text-amber-200">Enable Demo Data Mode</span><input type="checkbox" checked={settings.isDemoMode} onChange={(event) => updateSettings({ isDemoMode: event.target.checked })} className="accent-amber-500" /></label></section>}
        <section className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-2"><div className="flex gap-1.5 text-slate-200"><Info className="w-3.5 h-3.5 text-indigo-400" />About &amp; Data Sources</div><p>Location search and weather data are provided by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" aria-label="Open-Meteo (opens in a new tab)" className="text-indigo-300 underline underline-offset-2">Open-Meteo</a> under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" aria-label="Creative Commons Attribution 4.0 (opens in a new tab)" className="text-indigo-300 underline underline-offset-2">CC BY 4.0</a>; location names are based on GeoNames. Air-quality forecasts use <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer" aria-label="CAMS ENSEMBLE data via Open-Meteo (opens in a new tab)" className="text-indigo-300 underline underline-offset-2">CAMS ENSEMBLE data via Open-Meteo</a>. Values are validated and normalized before display.</p><p>News is supplied by <a href="https://currentsapi.services/" target="_blank" rel="noreferrer" aria-label="Currents News API (opens in a new tab)" className="text-indigo-300 underline underline-offset-2">Currents News API</a> through a scheduled static cache; the browser never receives the provider key. Market prices, exchange delay labels, and widget attribution come from <a href="https://www.tradingview.com/widget-docs/widgets/tickers/ticker-tape/" target="_blank" rel="noreferrer" aria-label="TradingView (opens in a new tab)" className="text-indigo-300 underline underline-offset-2">TradingView</a>. Other optional panels may use NWS, Frankfurter, AlAdhan, or Alpha Vantage.</p></section>
      </div>
      <footer className="section-rule pt-6 flex justify-between gap-3 mt-6"><button type="button" onClick={resetSettings} className="compact-control flex gap-1.5 px-3 py-2 text-xs"><RotateCcw className="w-3.5 h-3.5" />Reset to defaults</button><button type="button" onClick={onClose} className="compact-control px-5 py-2 font-semibold text-xs" data-selected="true">Apply &amp; close</button></footer>
    </aside>
  </div>;
}
