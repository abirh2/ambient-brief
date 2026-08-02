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
      const elements = drawerRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = originalOverflow; window.removeEventListener('keydown', handleKeyDown); trigger?.focus(); };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
    <aside ref={drawerRef} className={`relative z-50 w-full sm:max-w-[400px] 2xl:max-w-[440px] h-full bg-[#0f172a]/95 text-slate-100 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar p-6 backdrop-blur-2xl ${settings.reducedMotion ? '' : 'transition-transform duration-300 ease-out'}`}>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex gap-2"><Sliders className="w-5 h-5 text-indigo-400" /><div><h2 id="settings-drawer-title" className="text-lg font-bold">Preferences</h2><p className="text-xs text-slate-400">Customize Ambient Brief dashboard</p></div></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close preferences drawer" className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></header>
        <LocationSettingsSection />
        <DisplaySettingsSection />
        <ContentSettingsSection />
        <OptionalSettingsSection />
        <ProviderSettingsSection />
        {import.meta.env.DEV && <section className="flex flex-col gap-3 pt-3 border-t border-white/10"><h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Demo Data Mode</h3><label className="flex justify-between text-xs bg-slate-900/60 p-3 rounded-lg border border-amber-500/30"><span className="text-amber-200">Enable Demo Data Mode</span><input type="checkbox" checked={settings.isDemoMode} onChange={(event) => updateSettings({ isDemoMode: event.target.checked })} className="accent-amber-500" /></label></section>}
        <section className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-2"><div className="flex gap-1.5 text-slate-200"><Info className="w-3.5 h-3.5 text-indigo-400" />About &amp; Data Sources</div><p>Location search and weather data are provided by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-2">Open-Meteo</a> under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-2">CC BY 4.0</a>; location names are based on GeoNames. Air-quality forecasts use <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-2">CAMS ENSEMBLE data via Open-Meteo</a>. Values are validated and normalized before display.</p><p>Other optional panels may use NWS, GDELT, Frankfurter, AlAdhan, or Alpha Vantage.</p></section>
      </div>
      <footer className="pt-6 border-t border-white/10 flex justify-between gap-3 mt-6"><button type="button" onClick={resetSettings} className="flex gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-xs"><RotateCcw className="w-3.5 h-3.5" />Reset to Defaults</button><button type="button" onClick={onClose} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs">Apply &amp; Close</button></footer>
    </aside>
  </div>;
}
