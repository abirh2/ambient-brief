import { useEffect, useRef, useState } from 'react';
import { Database, RefreshCw, Settings2, Sparkles, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { LocationSettingsSection } from './LocationSettingsSection';
import {
  AppearanceSettingsSection,
  ContentSettingsSection,
  DataPrivacySettingsSection,
  GeneralSettingsSection,
  OptionalSettingsSection,
} from './SettingsSections';
import type { MarketState } from '../../features/markets/model';

type SettingsPage = 'general' | 'content' | 'appearance' | 'optional' | 'data';

const PAGES: ReadonlyArray<{ id: SettingsPage; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'content', label: 'Content' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'optional', label: 'Optional' },
  { id: 'data', label: 'Data & Privacy' },
];

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  marketState: MarketState;
  onRefreshMarkets: () => void;
  onClearMarketCache: () => void;
}

export function SettingsDrawer({ isOpen, onClose, triggerRef, marketState, onRefreshMarkets, onClearMarketCache }: SettingsDrawerProps) {
  const settings = useSettingsStore((state) => state.settings);
  const { fetchCurrencies } = useCurrencyStore();
  const [page, setPage] = useState<SettingsPage>('general');
  const [providerOpen, setProviderOpen] = useState(false);
  const providerOpenRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const providerCloseRef = useRef<HTMLButtonElement>(null);
  const configureTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { if (isOpen) void fetchCurrencies(); }, [fetchCurrencies, isOpen]);
  useEffect(() => { providerOpenRef.current = providerOpen; }, [providerOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const trigger = triggerRef?.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (providerOpenRef.current) {
          setProviderOpen(false);
          configureTriggerRef.current?.focus();
        } else onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const scope = providerOpenRef.current ? providerRef.current : drawerRef.current;
      if (!scope) return;
      const elements = getFocusableElements(scope);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  useEffect(() => { if (providerOpen) providerCloseRef.current?.focus(); }, [providerOpen]);
  if (!isOpen) return null;

  const openProvider = () => {
    configureTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setProviderOpen(true);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentPage: SettingsPage) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = PAGES.findIndex((item) => item.id === currentPage);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? PAGES.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + PAGES.length) % PAGES.length;
    const nextPage = PAGES[nextIndex];
    if (!nextPage) return;
    setPage(nextPage.id);
    window.requestAnimationFrame(() => document.getElementById(`settings-tab-${nextPage.id}`)?.focus());
  };

  return <div className="settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
    <button type="button" onClick={onClose} className="settings-backdrop" aria-label="Close preferences" />
    <aside ref={drawerRef} data-variant="secondary" className={`settings-drawer glass-panel ${settings.reducedMotion ? 'reduce-motion' : ''}`}>
      <header className="settings-header">
        <div className="settings-title-row">
          <div><span className="settings-eyebrow"><Settings2 aria-hidden="true" />Ambient Brief</span><h2 id="settings-drawer-title">Preferences</h2><p>Make the dashboard feel right for your space.</p></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close preferences" className="compact-control settings-close"><X aria-hidden="true" /></button>
        </div>
        <nav className="settings-tabs" role="tablist" aria-label="Preference sections">
          {PAGES.map((item) => <button key={item.id} id={`settings-tab-${item.id}`} type="button" role="tab" aria-selected={page === item.id} aria-controls={`settings-panel-${item.id}`} tabIndex={page === item.id ? 0 : -1} onClick={() => setPage(item.id)} onKeyDown={(event) => handleTabKeyDown(event, item.id)} className="settings-tab">{item.label}</button>)}
        </nav>
      </header>

      <div className="settings-scroll-region">
        <div id={`settings-panel-${page}`} role="tabpanel" aria-labelledby={`settings-tab-${page}`} tabIndex={0} className="settings-page">
          {page === 'general' && <><LocationSettingsSection /><GeneralSettingsSection /></>}
          {page === 'content' && <ContentSettingsSection marketState={marketState} onRefreshMarkets={onRefreshMarkets} onConfigureProvider={openProvider} />}
          {page === 'appearance' && <AppearanceSettingsSection />}
          {page === 'optional' && <OptionalSettingsSection />}
          {page === 'data' && <DataPrivacySettingsSection marketState={marketState} onClearMarketCache={onClearMarketCache} onConfigureProvider={openProvider} />}
          {import.meta.env.DEV && page === 'data' && <DevModeSetting />}
        </div>
        <footer className="settings-footer"><p>Changes are saved on this device as you make them.</p><button type="button" onClick={onClose} className="compact-control" data-selected="true">Done</button></footer>
      </div>
    </aside>
    {providerOpen && <ProviderDialog ref={providerRef} closeButtonRef={providerCloseRef} marketState={marketState} onClose={() => { setProviderOpen(false); configureTriggerRef.current?.focus(); }} onRefresh={onRefreshMarkets} onClearCache={onClearMarketCache} />}
  </div>;
}

function ProviderDialog({ ref, closeButtonRef, marketState, onClose, onRefresh, onClearCache }: { ref: React.Ref<HTMLDivElement>; closeButtonRef: React.RefObject<HTMLButtonElement | null>; marketState: MarketState; onClose: () => void; onRefresh: () => void; onClearCache: () => void }) {
  return <div className="provider-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="provider-dialog-title">
    <button type="button" className="provider-dialog-backdrop" onClick={onClose} aria-label="Close provider settings" />
    <div ref={ref} className="provider-dialog glass-panel" data-variant="secondary">
      <header><div><span className="settings-eyebrow"><Database aria-hidden="true" />Markets</span><h2 id="provider-dialog-title">Finnhub provider</h2></div><button ref={closeButtonRef} type="button" onClick={onClose} className="compact-control settings-close" aria-label="Close provider settings"><X aria-hidden="true" /></button></header>
      <div className="provider-dialog-content">
        <div className="provider-connection-summary"><span className={`provider-status-dot provider-status-dot--${marketState.status === 'loaded' || marketState.status === 'cached' ? 'ok' : marketState.status === 'unavailable' ? 'off' : 'warn'}`} /><div><strong>{marketState.status === 'unavailable' ? 'Provider unavailable' : marketState.status === 'loading' ? 'Checking connection' : 'Snapshot connected'}</strong><span>Finnhub · scheduled snapshot</span></div></div>
        <section><h3>Key management</h3><p>The Finnhub key belongs in the repository secret used by the scheduled data workflow. It is never entered into or exposed by this browser.</p></section>
        <section className="provider-guidance"><h3>Why there is no key field</h3><p>A key saved in a frontend application can be read by anyone who loads it. Ambient Brief publishes only the validated market snapshot, keeping the credential outside the app.</p></section>
        <div className="settings-actions-row"><button type="button" onClick={onRefresh} disabled={marketState.status === 'loading'} className="compact-control"><RefreshCw aria-hidden="true" className={marketState.status === 'loading' ? 'animate-spin' : ''} />Check connection</button><button type="button" onClick={onClearCache} className="compact-control">Clear market cache</button></div>
      </div>
      <footer><button type="button" onClick={onClose} className="compact-control" data-selected="true">Done</button></footer>
    </div>
  </div>;
}

function DevModeSetting() {
  const { settings, updateSettings } = useSettingsStore();
  return <section className="settings-group settings-dev-group"><div className="settings-group-heading"><div><h3><Sparkles aria-hidden="true" />Demo data</h3><p>Development-only simulated content.</p></div></div><label className="settings-switch-row"><span className="settings-switch-copy"><span><strong>Demo data mode</strong></span></span><input className="settings-switch-input" type="checkbox" checked={settings.isDemoMode} onChange={(event) => updateSettings({ isDemoMode: event.target.checked })} /></label></section>;
}

function getFocusableElements(scope: HTMLElement): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
}
