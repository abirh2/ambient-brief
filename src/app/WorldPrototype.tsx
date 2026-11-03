import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Compass, MoveRight, Pause, Play, RotateCcw, Waves } from 'lucide-react';
import { useClock } from '../features/clock/useClock';
import { initialNavigation, navigate, type Navigation } from '../features/living-world/navigation';
import { useSettingsStore } from '../stores/settingsStore';
import '../features/living-world/prototype.css';

const reducedQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (callback: () => void) => {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
};

class WorldBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function StudyClock() {
  const now = useClock();
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return <div className="world-clock">
    <time dateTime={now.toISOString()} aria-label={`${time}:${seconds} · Device time`} aria-live="off">{time}<span>{seconds}</span></time>
    <p>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now)}</p>
    <p className="world-muted">Device time · {Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_', ' ')}</p>
  </div>;
}

function WorldSlot({ navigation, reduced, visible, onSettled, onSelect, onUnavailable, onAvailable, onRetryFocus }: {
  navigation: Navigation; reduced: boolean; visible: boolean;
  onSettled: (id: number) => void; onSelect: () => void; onUnavailable: () => void; onAvailable: () => void; onRetryFocus: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'deferred' | 'loading' | 'ready' | 'failed'>('deferred');
  const [imageFailed, setImageFailed] = useState(false);
  const attemptId = useRef(0);
  const failedAttempt = useRef(false);
  const Renderer = useMemo(() => {
    // Each explicit retry gets its own lazy boundary, with no automatic reload loop.
    void attempt;
    return lazy(() => import('../features/living-world/renderer/WorldEntry'));
  }, [attempt]);
  const fail = useCallback(() => {
    if (attemptId.current !== attempt || failedAttempt.current) return;
    failedAttempt.current = true;
    setStatus('failed'); onUnavailable();
  }, [onUnavailable, attempt]);
  const ready = useCallback(() => {
    if (attemptId.current !== attempt || failedAttempt.current) return;
    setStatus('ready');
    onAvailable();
    performance.mark('living-world-ready');
  }, [onAvailable, attempt]);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setStatus('loading')); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, []);
  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = window.setTimeout(fail, 15_000);
    return () => window.clearTimeout(timeout);
  }, [status, fail]);
  return <div className="world-slot" data-world-status={status}>
    <div className="world-still" aria-hidden="true">
      {!imageFailed && <img src={`${import.meta.env.BASE_URL}world/v1/overview.webp`} alt="" onError={() => setImageFailed(true)} />}
    </div>
    {(status === 'loading' || status === 'ready') && <WorldBoundary key={attempt} onFailure={fail}>
      <Suspense fallback={null}><Renderer navigation={navigation} reduced={reduced} visible={visible} low={attempt > 0}
        onReady={ready} onFailure={fail} onSelect={onSelect} onSettled={onSettled} /></Suspense>
    </WorldBoundary>}
    {status !== 'ready' && <div className="world-recovery" role="status">
      <Waves aria-hidden="true" size={20} />
      <p>{status === 'failed' ? 'The 3D world is unavailable. The island study remains accessible.' : 'Preparing the island. Controls are ready.'}</p>
      {status === 'failed' && <button onClick={() => {
        onRetryFocus();
        attemptId.current += 1; failedAttempt.current = false;
        setAttempt(attemptId.current); setStatus('loading');
      }}>Retry world <RotateCcw size={16} aria-hidden="true" /></button>}
    </div>}
  </div>;
}

export default function WorldPrototype() {
  const [navigation, dispatch] = useReducer(navigate, initialNavigation);
  const [still, setStill] = useState(false);
  const [worldAvailable, setWorldAvailable] = useState(true);
  const osReduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(reducedQuery).matches);
  const visible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== 'hidden');
  const savedReduced = useSettingsStore((state) => state.settings.reducedMotion || state.settings.backgroundMotion === 'static');
  const reduced = osReduced || savedReduced || still;
  const overviewButton = useRef<HTMLButtonElement>(null);
  const travelButton = useRef<HTMLButtonElement>(null);
  const stationHeading = useRef<HTMLHeadingElement>(null);
  const focusAfterSettle = useRef(false);
  const invoker = useRef<Element | null>(null);
  const settled = useCallback((id: number) => dispatch({ type: 'settled', id }), []);
  const stop = useCallback(() => dispatch({ type: 'stop' }), []);
  const restoreWorldFocus = useCallback(() => overviewButton.current?.focus({ preventScroll: true }), []);
  const unavailable = useCallback(() => {
    if (document.activeElement === travelButton.current) restoreWorldFocus();
    setWorldAvailable(false); dispatch({ type: 'instant' });
  }, [restoreWorldFocus]);
  const available = useCallback(() => setWorldAvailable(true), []);
  const select = useCallback(() => {
    focusAfterSettle.current = true; invoker.current = document.activeElement;
    dispatch({ type: 'visit', target: 'observatory' });
    if (!worldAvailable) dispatch({ type: 'instant' });
  }, [worldAvailable]);
  useEffect(() => {
    performance.mark('living-world-shell-ready');
    const cancel = () => dispatch({ type: 'stop' });
    window.addEventListener('resize', cancel);
    return () => window.removeEventListener('resize', cancel);
  }, []);
  useEffect(() => { if (!visible && navigation.phase === 'moving') stop(); }, [visible, navigation.phase, stop]);
  useEffect(() => { if (reduced) dispatch({ type: 'instant' }); }, [reduced]);
  useEffect(() => {
    if (navigation.phase !== 'rest' || !focusAfterSettle.current || !visible) return;
    focusAfterSettle.current = false;
    if (document.activeElement !== invoker.current
      && (invoker.current?.isConnected || document.activeElement !== document.body)) return;
    if (navigation.settled === 'overview') overviewButton.current?.focus({ preventScroll: true });
    else stationHeading.current?.focus({ preventScroll: true });
  }, [navigation.phase, navigation.settled, visible]);
  function returnOverview() {
    focusAfterSettle.current = true; invoker.current = document.activeElement;
    dispatch({ type: 'visit', target: 'overview' });
    if (!worldAvailable) dispatch({ type: 'instant' });
  }
  const focused = navigation.settled === 'observatory';
  return <main className={`world-prototype ${reduced ? 'world-reduced' : ''}`} onKeyDown={(event) => {
    if (event.key !== 'Escape') return;
    if (navigation.phase === 'moving') stop();
    else if (navigation.target !== 'overview') returnOverview();
  }}>
    <WorldSlot navigation={navigation} reduced={reduced} visible={visible} onSettled={settled} onSelect={select} onUnavailable={unavailable} onAvailable={available} onRetryFocus={restoreWorldFocus} />
    <div className="world-frame">
      <header className="world-header">
        <a className="world-wordmark" href={import.meta.env.BASE_URL}><Waves size={24} aria-hidden="true" />Ambient Brief</a>
        <span className="world-study-label">Living World · Development study</span>
        <a className="world-dashboard-link" href={import.meta.env.BASE_URL}>Open dashboard <ArrowUpRight size={17} aria-hidden="true" /></a>
      </header>
      <aside className="world-reading-rail" aria-label="Island study">
        <StudyClock />
        <section className="world-introduction" aria-labelledby="world-title">
          <h1 id="world-title">A place to<br />read the day.</h1>
          <p>A quiet island on the Atlantic.<br />One observatory. A different perspective.</p>
          <p className="world-muted">Illustrative daylight · No weather feed connected</p>
        </section>
        <nav className="world-navigation" aria-label="Island camera">
          <button ref={overviewButton} onClick={returnOverview} aria-pressed={navigation.target === 'overview'}>{navigation.target === 'overview' ? <Compass size={18} aria-hidden="true" /> : <ArrowLeft size={18} aria-hidden="true" />}{navigation.target === 'overview' ? 'Overview' : 'Return to Overview'}</button>
          <button onClick={select} aria-pressed={navigation.target === 'observatory'}>Select Observatory <MoveRight size={18} aria-hidden="true" /></button>
          {navigation.phase !== 'rest' && <button ref={travelButton} onClick={(event) => {
            if (navigation.phase === 'moving') stop();
            else {
              focusAfterSettle.current = true; invoker.current = event.currentTarget;
              dispatch({ type: 'visit', target: navigation.target });
            }
          }}>{navigation.phase === 'moving' ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {navigation.phase === 'moving' ? 'Stop motion' : `Continue to ${navigation.target === 'overview' ? 'Overview' : 'Observatory'}`}
          </button>}
        </nav>
        <p className="world-travel-status" role="status">{navigation.phase === 'moving' ? `Travelling to ${navigation.target === 'overview' ? 'Overview' : 'Observatory'}` : navigation.phase === 'stopped' ? 'Travel stopped' : focused ? 'At the Observatory' : 'Island overview'}</p>
      </aside>
      {focused && <section className="world-station-note" aria-labelledby="observatory-title">
        <h2 id="observatory-title" ref={stationHeading} tabIndex={-1}>The Observatory</h2>
        <p>Bronze above pale stone.<br />A sheltered place to watch the sky.</p>
        <p className="world-muted">Architectural prototype. Weather details will arrive in a later slice.</p>
      </section>}
      <footer className="world-footer">
        <div><span className="world-footer-title">The Atlantic observatory</span><span className="world-muted">Limestone · Cedar · Weathered bronze</span></div>
        <div className="world-footer-controls"><span className="world-muted">{osReduced || savedReduced ? 'Reduced motion active' : 'Guided exploration'}</span>
          <button onClick={() => setStill((value) => !value)} aria-pressed={reduced} disabled={osReduced || savedReduced}>{reduced ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{reduced ? 'Still view' : 'Motion on'}</button>
        </div>
      </footer>
    </div>
  </main>;
}
