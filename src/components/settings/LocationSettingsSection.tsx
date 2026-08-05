import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Globe, Loader2, Navigation, RotateCcw, Search, X } from 'lucide-react';
import { useAppLocation } from '../../hooks/useAppLocation';
import { searchLocations, formatLocationLabel } from '../../lib/services/geocodingService';
import type { AppLocation } from '../../lib/types';

export function LocationSettingsSection() {
  const { activeLocation, formattedLabel, useCurrentLocation, deviceLocationState, requestDeviceLocation, setCustomLocation, clearLocation } = useAppLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppLocation[]>([]);
  const [pending, setPending] = useState<AppLocation | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchState('idle');
      setFocusedIndex(-1);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearchState('loading');
    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchLocations(trimmed, { count: 8, signal: controller.signal });
        if (!controller.signal.aborted) {
          setResults(matches);
          setSearchState(matches.length ? 'idle' : 'empty');
          setFocusedIndex(-1);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted && !(error instanceof Error && error.name === 'AbortError')) {
          setResults([]);
          setSearchState('error');
        }
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    if (focusedIndex >= 0) (listRef.current?.children[focusedIndex] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setPending(null);
    setSearchState('idle');
    setFocusedIndex(-1);
  };

  const handleSearchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setFocusedIndex((current) => current < results.length - 1 ? current + 1 : 0); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setFocusedIndex((current) => current > 0 ? current - 1 : results.length - 1); }
    if (event.key === 'Enter' && focusedIndex >= 0) { event.preventDefault(); setPending(results[focusedIndex]); }
  };

  return <div className="settings-section-stack">
    <section className="settings-group" aria-labelledby="location-heading">
      <div className="settings-group-heading"><div><h3 id="location-heading">Location</h3><p>Weather, daylight and local context follow this place.</p></div></div>
      <div className="location-summary">
        {activeLocation.source === 'device' ? <Navigation aria-hidden="true" /> : <Globe aria-hidden="true" />}
        <div><span>Current location</span><strong title={formattedLabel}>{formattedLabel}</strong><small>{activeLocation.source === 'device' ? 'Device location' : 'Saved location'}</small></div>
      </div>
      <div className="settings-actions-row settings-actions-row--location">
        <button type="button" onClick={requestDeviceLocation} disabled={deviceLocationState.status === 'loading'} aria-pressed={useCurrentLocation && activeLocation.source === 'device'} className="compact-control">
          {deviceLocationState.status === 'loading' ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Navigation aria-hidden="true" />}
          {useCurrentLocation && activeLocation.source === 'device' ? 'Refresh device location' : 'Use device location'}
        </button>
        <button type="button" onClick={clearLocation} className="compact-control"><RotateCcw aria-hidden="true" />Reset</button>
      </div>
      {deviceLocationState.status === 'error' && <p className="settings-inline-message settings-inline-message--warning"><AlertCircle aria-hidden="true" />{deviceLocationState.errorMessage}</p>}

      <div className="location-search">
        <label htmlFor="location-search-input">Search for a location</label>
        <div className="location-search-input"><Search aria-hidden="true" /><input id="location-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleSearchKeys} placeholder="City or region" autoComplete="off" aria-autocomplete="list" aria-controls="location-search-results" aria-expanded={results.length > 0} className="compact-control" />{searchState === 'loading' ? <Loader2 aria-hidden="true" className="animate-spin" /> : query ? <button type="button" onClick={clearSearch} aria-label="Clear location search"><X aria-hidden="true" /></button> : null}</div>
        {results.length > 0 && <ul id="location-search-results" ref={listRef} role="listbox" aria-label="Location search results" className="location-results">
          {results.map((location, index) => <li key={location.id} role="option" aria-selected={pending?.id === location.id}><button type="button" onMouseEnter={() => setFocusedIndex(index)} onClick={() => setPending(location)} className="compact-control" data-selected={pending?.id === location.id}><span><strong>{location.name}</strong><small>{[location.admin1, location.country].filter(Boolean).join(', ')}</small></span>{(pending?.id === location.id || activeLocation.id === location.id) && <Check aria-hidden="true" />}</button></li>)}
        </ul>}
        {searchState === 'empty' && <p className="settings-inline-message">No matching locations. Try another spelling.</p>}
        {searchState === 'error' && <p className="settings-inline-message settings-inline-message--error"><AlertCircle aria-hidden="true" />Location search is unavailable. Check your connection and try again.</p>}
        {pending && <div className="location-confirmation"><div><span>Selected location</span><strong>{formatLocationLabel(pending)}</strong></div><div><button type="button" onClick={() => setPending(null)} className="compact-control">Cancel</button><button type="button" onClick={() => { setCustomLocation(pending); clearSearch(); }} className="compact-control" data-selected="true">Use location</button></div></div>}
      </div>
    </section>
  </div>;
}
