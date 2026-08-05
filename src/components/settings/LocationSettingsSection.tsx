import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Check,
  Loader2,
  AlertCircle,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { useAppLocation } from '../../hooks/useAppLocation';
import { searchLocations, formatLocationLabel } from '../../lib/services/geocodingService';
import { AppLocation } from '../../lib/types';

export const LocationSettingsSection: React.FC = () => {
  const {
    activeLocation,
    formattedLabel,
    useCurrentLocation,
    deviceLocationState,
    requestDeviceLocation,
    setCustomLocation,
    clearLocation,
  } = useAppLocation();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected candidate preview (before confirmation)
  const [pendingLocation, setPendingLocation] = useState<AppLocation | null>(null);

  // Keyboard navigation index
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // AbortController ref for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Debounced Search Handler
  useEffect(() => {
    const query = searchQuery.trim();

    // Reset results if query is too short
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      setHasSearched(false);
      setFocusedIndex(-1);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(query, {
          count: 8,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSearchResults(results);
          setIsSearching(false);
          setHasSearched(true);
          setFocusedIndex(-1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (!controller.signal.aborted) {
          setIsSearching(false);
          setSearchError('Failed to search locations. Please check your connection.');
          setSearchResults([]);
          setHasSearched(true);
        }
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery]);

  // Handle selecting a search result candidate
  const handleSelectCandidate = (location: AppLocation) => {
    setPendingLocation(location);
  };

  // Confirm pending location as active
  const handleConfirmLocation = () => {
    if (pendingLocation) {
      setCustomLocation(pendingLocation);
      setPendingLocation(null);
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setHasSearched(false);
    setFocusedIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Keyboard Navigation in Search Results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        e.preventDefault();
        handleSelectCandidate(searchResults[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClearSearch();
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <section className="section-rule flex flex-col gap-3.5 pt-3 pb-1">
      <div className="flex items-center justify-between">
        <h3 className="type-label font-semibold text-[color:var(--text-secondary)] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 semantic-info" /> Location settings
        </h3>
        <span className="type-metadata numeric text-[color:var(--text-muted)]">
          {activeLocation.source}
        </span>
      </div>

      {/* Active Saved Location Display */}
      <div className="tonal-section p-3 flex flex-col gap-1.5">
        <span className="type-metadata font-medium text-[color:var(--text-muted)]">Current active location</span>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
            {activeLocation.source === 'device' ? (
              <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="leading-tight">{formattedLabel}</span>
          </div>

          <button
            type="button"
            onClick={clearLocation}
            title="Reset to default location"
            className="compact-control p-1 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="sr-only sm:not-sr-only text-[10px]">Reset</span>
          </button>
        </div>
      </div>

      {/* Use Current Device Location */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={requestDeviceLocation}
          disabled={deviceLocationState.status === 'loading'}
          aria-pressed={useCurrentLocation}
          className={`compact-control flex items-center justify-between p-2.5 text-xs font-medium ${
            useCurrentLocation
              ? 'semantic-positive'
              : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Navigation
              className={`w-4 h-4 ${
                useCurrentLocation ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>{useCurrentLocation && activeLocation.source === 'device' ? 'Refresh Device Location' : 'Use Device Location'}</span>
          </div>

          {deviceLocationState.status === 'loading' ? (
            <div className="flex items-center gap-1.5 semantic-info font-normal">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Detecting...</span>
            </div>
          ) : (
            <div
              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                useCurrentLocation
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                  : 'border-white/20 bg-white/5'
              }`}
            >
              {useCurrentLocation && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          )}
        </button>

        {/* Device Geolocation Error Alert */}
        {deviceLocationState.status === 'error' && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-200 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-amber-300">Location Request Notice</span>
              <span>{deviceLocationState.errorMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Location Search */}
      <div className="flex flex-col gap-2">
        <label htmlFor="location-search-input" className="text-xs font-medium text-slate-300">
          Search City or Region
        </label>

        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="location-search-input"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Upper Darby, London, Tokyo..."
            aria-autocomplete="list"
            aria-controls="location-search-results"
            aria-expanded={searchResults.length > 0}
            className="compact-control w-full pl-9 pr-9 py-2 text-xs placeholder-slate-500"
          />

          {isSearching ? (
            <Loader2 className="w-4 h-4 semantic-info animate-spin absolute right-3" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search text"
              className="p-1 rounded text-slate-400 hover:text-white absolute right-2.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown / List */}
        {searchResults.length > 0 && (
          <div className="tonal-section flex flex-col gap-1 p-1 max-h-52 overflow-y-auto no-scrollbar">
            <span className="type-metadata font-semibold text-[color:var(--text-muted)] px-2 py-1">
              Search Results ({searchResults.length})
            </span>

            <ul
              id="location-search-results"
              ref={listboxRef}
              role="listbox"
              className="flex flex-col gap-0.5"
            >
              {searchResults.map((loc, idx) => {
                const isFocused = idx === focusedIndex;
                const isSelectedPending = pendingLocation?.id === loc.id;
                const isActive = activeLocation.id === loc.id;

                return (
                  <li
                    key={loc.id}
                    role="option"
                    aria-selected={isFocused || isSelectedPending}
                    onClick={() => handleSelectCandidate(loc)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    data-selected={isSelectedPending}
                    className={`compact-control flex items-center justify-between p-2 cursor-pointer text-xs ${
                      isSelectedPending
                        ? ''
                        : isFocused
                        ? 'text-slate-100'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-100">{loc.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                      </span>
                    </div>

                    {isActive ? (
                      <span className="text-[10px] font-semibold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Active
                      </span>
                    ) : isSelectedPending ? (
                      <Check className="w-4 h-4 semantic-info" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Search State Messages */}
        {hasSearched && !isSearching && searchResults.length === 0 && !searchError && (
          <div className="p-3 rounded-lg bg-slate-900/40 border border-white/5 text-center text-xs text-slate-400">
            No locations matching &ldquo;{searchQuery}&rdquo;. Try another city or spelling.
          </div>
        )}

        {searchError && (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Selected Candidate Confirmation Preview */}
        {pendingLocation && (
          <div className="tonal-section flex flex-col gap-2 p-3 mt-1 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="type-metadata font-semibold semantic-info">
                  Selected location
                </span>
                <span className="text-xs font-bold text-white">
                  {formatLocationLabel(pendingLocation)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPendingLocation(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="section-rule flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingLocation(null)}
                className="px-2.5 py-1 rounded text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLocation}
                className="compact-control px-3 py-1 font-semibold text-xs flex items-center gap-1"
                data-selected="true"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm &amp; Set Location</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
