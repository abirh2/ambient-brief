# Current feature inventory

Audited 2026-11-02 against the application revision and working tree recorded in [the system audit](../specs/01-existing-system-audit.md). This inventories **source-verified behavior**, not a new feature specification or a browser acceptance result. Refresh/cache details and provenance limitations are centralized in [data contracts](data-contracts.md). No functionality was modified.

Disposition vocabulary: **preserve** means retain capability/business behavior; **adapt** means retain capability through new state/interaction boundaries; **replace visually** permits future presentation replacement only after specification review. These are recommendations, not authorization to remove features. “Dependencies” below names domain/shared dependencies in addition to React; Lucide/CSS handle common visual treatment.

## F01 — clock, calendar date, and location identity

- **Behavior/data:** Local device clock, formatted in the selected location's IANA timezone; prominent hours/minutes, seconds, 12-hour period or 24-hour display; calendar date, compact location with full-label tooltip and device-location indicator. No network time synchronization.
- **Refresh/interactions:** `useClock` updates every second. Time format and location changes apply through settings. Header opens Preferences and triggers global refresh. Accessible time label has live announcements off to avoid second-by-second announcements.
- **States:** No remote loading state; location/timezone defaults provide initial display. Device clock/timezone validity affects accuracy; browser fallback formatting is not verified globally.
- **Files/dependencies:** `components/header/ClockHeader.tsx`, `features/clock/useClock.ts`, `lib/formatting/*`, `hooks/useAppLocation.ts`, settings store and Intl.
- **Disposition:** Preserve priority and timezone behavior; replace visually for the lighthouse/HTML clock. Never require camera travel to read the time.

## F02 — saved/manual and device location

- **Behavior/data:** Default Upper Darby, Pennsylvania. Search Open-Meteo cities/regions; confirm a pending selection before applying it. Explicit device Geolocation request, then optional BigDataCloud reverse naming. Coordinates remain usable as “My Location” if naming fails; country may be unknown, preventing US-only alerts. Device timezone comes from browser Intl, search timezone from provider.
- **Refresh/interactions:** Two-character search minimum, 300 ms debounce, up to eight results in the drawer; cancellation on query changes/unmount. Arrow-key result navigation, Enter selects pending result; Use location/Cancel, clear search, location reset, and Use/Refresh device location. No continuous location watch or automatic permission prompt.
- **States:** Idle/searching/results/empty/search error; device loading, permission denied, unavailable, timeout, unsupported and unknown errors. Search/device failure preserves the existing chosen location; invalid stored location falls back to default.
- **Files/dependencies:** `components/settings/LocationSettingsSection.tsx`, `hooks/useAppLocation.ts`, `features/location/model.ts`, `lib/services/{geocodingService,reverseGeocodingService}.ts`, location schema, settings store, browser Geolocation/Intl.
- **Disposition:** Preserve explicit consent, confirmation, fallback and persistence; adapt settings UI. Review context-transition defects in R01/R02 before the world consumes it.

## F03 — current weather and concise insight

- **Behavior/data:** Open-Meteo temperature, condition, feels-like, daily high/low; optional details for humidity/wind with units. Deterministic summary sentence from forecast; no generated AI narrative. Fahrenheit/Celsius changes request units (also mph/km/h). High AQI ≥101 is promoted into weather copy.
- **Refresh/interactions:** 15-minute cache freshness, initial/reconnect/visible/manual/settings refresh through coordinator. Details disclosure; Enter location opens settings, retry requests weather. No own polling loop.
- **States:** Skeleton/loading; loaded; cached with age/connection message; location-unavailable error and retry/settings actions. Permission-denied weather view is implemented but actual denied device permission is reported by location settings while prior manual/default location remains; development controls can force the weather view. Demo fallback is development-only.
- **Files/dependencies:** `features/weather/{model,weatherService,formatting}.ts`, `hooks/useWeather.ts`, `providers/openMeteo*`, `utils/{weatherCodeMapper,weatherInsight}.ts`, `components/{WeatherHero,WeatherInsight,WeatherHeroSkeleton}.tsx`, cache/api client, settings/location, AQI interpretation.
- **Disposition:** Preserve normalized weather and summary; adapt provenance and environment projection; replace hero styling with observatory/HTML presentation.

## F04 — hourly forecast and precipitation

- **Behavior/data:** Next eight normalized forecast hours from the same two-day Open-Meteo response. Six displayed by default, expandable to all eight. Time, temperature, condition icon; precipitation probability shown at ≥15%, emphasized at ≥40%. Day/night icons use sunrise/sunset where available.
- **Refresh/interactions:** Refreshes with current weather, not a separate half-hour request despite the unused central hourly policy. Full forecast / Compact view; time labels honor time-format changes using retained `isoTime`.
- **States:** Part of weather skeleton/error/cached state; there is no separate hourly unavailable state. Provider schema requires aligned nonempty series.
- **Files/dependencies:** `features/weather/components/HourlyForecast.tsx`, weather provider/model/schemas, `lib/formatting/forecastTime.ts`, settings.
- **Disposition:** Preserve forecast, expand/collapse and readable precipitation; replace visually, accessible without a 3D-only interaction.

## F05 — official US weather alerts

- **Behavior/data:** NWS active alerts at coordinates for normalized country `US`; severity/urgency ordering; filters test/cancelled/expired alerts when loaded. Most important banner opens a detail modal with event, headline, affected area, instructions, timing, issuer and source. Multiple alerts have previous/next buttons accessible by keyboard. There is no custom arrow-key cycling handler.
- **Refresh/interactions:** 10-minute freshness; global/settings refresh; dismiss banner/individual modal alert. Dismissal persisted by stable alert ID and expiration/end. Modal supports Escape, focus containment/restoration and body scroll lock in source.
- **States:** No banner for no alerts, unsupported country, or no usable result; cached active alerts on request failure. Direct network TypeError without cache disables provider for that hook session and records diagnostics. No dedicated user-facing provider-unavailable indicator distinguishes “none” from “could not check.”
- **Files/dependencies:** `features/weather/hooks/useNWSAlerts.ts`, `providers/nwsAlertsProvider.ts`, `components/{WeatherAlertBanner,WeatherAlertModal}.tsx`, `features/alerts/model.ts`, cache, diagnostics, location, formatting, dismissal storage.
- **Disposition:** Preserve official content/severity/dismissal and HTML access. Adapt explicit availability/context/expiry handling. Old US alerts can survive a switch to non-US because the coordinator disables the provider before its clear branch runs (source finding, not runtime reproduction).

## F06 — ambient atmosphere and daylight cues

- **Behavior/data:** Decorative CSS sky/horizon/haze/grain/vignette driven by selected-location time, weather condition and sunrise/sunset. Derives daylight, sunset, morning/night states and moving light position. Unavailable weather selects a neutral clear effect; this is decoration, not fabricated weather data.
- **Refresh/interactions:** Time sample every five minutes; weather-driven changes after updates. Preferences offer Living/Subtle/Static background motion, glass intensity, and reduced motion. CSS pauses decorative animation while hidden and honors OS reduced motion. Dev controls can override atmosphere.
- **States:** Neutral unavailable-weather atmosphere; static reduced-motion mode. No existing 3D canvas or WebGL fallback.
- **Files/dependencies:** `components/background/AtmosphericBackground.tsx`, `features/weather/utils/atmosphericCalculator.ts`, `types/visuals.ts`, settings/dev stores, `index.css`, tokens.
- **Disposition:** Replace visually with the specified world; reuse tested pure calculations with an adapter. Preserve usable DOM fallback and explicit motion policy. Camera and weather animation semantics still need specification.

## F07 — news topics, stories, and external navigation

- **Behavior/data:** Validated static Currents feed; eight topics: Top, U.S., World, Business, Technology, Science, Sports, Entertainment. One to three selectable in preferences, active topic selected in panel. Featured story plus secondary stories; publisher, publication age, optional description/image. Ranking/deduplication and selection interleaving preserve category coverage; no unrelated-story fill for empty categories.
- **Refresh/interactions:** 25-minute browser freshness; feeds generated twice per hour. Once generated age exceeds 75 minutes, the minute coordinator scan can recheck static JSON each minute until a newer feed appears. Initial/stale/reconnect/visible/global/category refresh reads public JSON only. Topic selection filters current union locally. Compact desktop (width ≥1200, height ≤900) shows two secondary stories, other sizes four; View additional stories / Show less expands. Customize/Manage opens settings; failure Retry; links open in a new tab with `noopener noreferrer`.
- **States:** Skeleton, feed-empty, active-category-empty, error with retry, cached/delayed with age. Generated age >75 minutes or any partial feed becomes delayed/cached. Image URLs are filtered; lazy/async images use no-referrer and a placeholder on missing/broken source. No production mock news.
- **Files/dependencies:** `features/news/{model,newsService,generatedFeedSchemas}.ts`, `providers/{newsProvider,staticNewsProvider}.ts`, `hooks/useNews.ts`, `utils/*`, `components/{NewsPanel,FeaturedStory,StoryList,NewsImage,NewsSkeleton}.tsx`, `hooks/useViewportWidth.ts`, cache/settings/formatting; `scripts/fetch-news.ts` and news/Pages Actions.
- **Disposition:** Preserve topics, categorization/ranking, article links and failure behavior; adapt presentation state for signal station and HTML. Do not move provider authentication into the browser.

## F08 — markets and selected companies

- **Behavior/data:** Scheduled Finnhub snapshot for SPY/DIA/QQQ labeled explicitly as ETF proxies (not index levels), plus AAPL/MSFT/NVDA/AMZN/GOOGL/META. Price in USD, absolute/percentage change when present, per-row stale indication, estimated market session, source and generated age. Settings show/hide panel and choose one to six companies; proxies remain the broad-market context. No trading, charts, arbitrary ticker search or portfolio accounting.
- **Refresh/interactions:** Five-minute public-snapshot browser cache; provider generation uses independent Actions schedule. Panel refresh, global refresh and provider-dialog checks read newer published JSON; forced checks bypass browser cache and compare `generatedAt`, reporting already-current versus checked. Clear market cache is exposed in settings/provider dialog. Company selection changes displayed rows without new upstream quote requests.
- **States:** Loading skeleton; loaded, browser-cached, stale, partial-failure explanation and missing rows, unavailable with explanation; failed check keeps last valid state with notice. No zero-price or realistic mock substitution.
- **Files/dependencies:** `features/markets/{model,schemas,config,instruments,marketSnapshotClient}.ts`, `hooks/useMarkets.ts`, `components/MarketPanel.tsx`, shared remote/cache/API clients, settings; `scripts/update-market-data.ts`, market workflow.
- **Disposition:** Preserve snapshot/row contracts, proxy truthfulness, notice/refresh and company settings; replace visually for pavilion/HTML. Review stale/cancellation semantics before deriving animation from price movement.

## F09 — AQI, pollutant detail and guidance

- **Behavior/data:** Open-Meteo US AQI with interpreted category, general guidance and PM2.5/PM10/ozone µg/m³ values and measurement time in a details popover. Missing numeric AQI is `--`/Unknown even if pollutant data exists. Weather view emphasizes AQI ≥101.
- **Refresh/interactions:** 30-minute freshness; follows selected location, routine/global refresh. Context button opens popover; close, outside click, Escape.
- **States:** Loading text/spinner, unavailable, loaded, cached; cache-age detail passed into popover. No dedicated retry control; global refresh is available. Compact context reading does not itself show a cached badge, so freshness is less visible than in detail.
- **Files/dependencies:** `features/air-quality/{model,types}.ts`, provider/schemas, `hooks/useAirQuality.ts`, `utils/aqiInterpreter.ts`, `components/{AirQualityContextItem,AirQualityPopover}.tsx`, settings/formatting/cache/API.
- **Disposition:** Preserve values/units/guidance and unknown state; adapt freshness display and accessible popover. World haze must not be the only AQI communication.

## F10 — UV and sunset context

- **Behavior/data:** UV number and deterministic risk label; sunset clock in selected timezone/time format. Both use current weather payload; no separate daylight astronomy service or sunrise detail control. Sunrise is retained for atmosphere and may also appear in optional prayer schedule.
- **Refresh/interactions:** Weather cadence; no independent controls. Context shows Weather cached/unavailable when applicable.
- **States:** `--` and unavailable UV label if missing; `--` sunset if missing. There is no dedicated UV/daylight fetch, permission or retry state.
- **Files/dependencies:** `components/common/ContextBar.tsx`, `features/weather/formatting.ts`, weather model/provider, formatting/settings.
- **Disposition:** Preserve concise HTML context; adapt into observatory/lighthouse context without implying missing data is live.

## F11 — currency reference and selector

- **Behavior/data:** Optional Frankfurter v1 reference rate; default USD/BDT; pair label/value, stale indicator and details with equation, reference date, source and last fetched time. It is informational, not a converter or intraday change chart.
- **Refresh/interactions:** Currency list fetched on Preferences open (24-hour fresh cache); rate loaded by coordinator on initial/enabled/pair/global refresh (12-hour cache). Searchable separate base/quote selectors exclude same-currency pair. **Caveat:** routine stale predicate examines store flag/missing rate rather than cache age, so an initially successful mounted rate can remain unchanged beyond 12 hours until another trigger.
- **States:** Disabled reading when off, rate loading, unavailable, `--`, cached stale fallback. Search list failure uses a short static list of currency names, including BDT; this is selector metadata, not a mock rate or proof provider supports each currency. Provider support/default-pair success was not tested live.
- **Files/dependencies:** `features/currency/{model,providers/frankfurterProvider}.ts`, `stores/currencyStore.ts`, `components/CurrencyContextItem.tsx` within feature, `components/settings/{SearchableCurrencySelector,SettingsSections,SettingsDrawer}.tsx`, cache/diagnostics/formatting/settings.
- **Disposition:** Preserve reference-date semantics and optionality; adapt state/provenance and resolve endpoint compatibility separately. Current v1 is externally documented as deprecated but available; provider replacement/version migration is not authorized here.

## F12 — optional prayer, Hijri date and schedule

- **Behavior/data:** Off by default. AlAdhan today/tomorrow schedules, next prayer and minute countdown (sunrise excluded as next prayer); after Isha selects tomorrow Fajr. Optional Hijri date and expandable six-row schedule including sunrise; past/next emphasis. Five calculation methods (ISNA/MWL/Egyptian/Karachi/Makkah), Standard/Hanafi Asr selection.
- **Refresh/interactions:** Initial/enabled/location/calculation refresh; local-date rollover checked by coordinator; force refresh clears dated keys. Countdown every minute. Full-schedule preference exposes a Schedule disclosure; expansion is local. Time format changes reformat without provider refresh.
- **States:** Calculating/loading, unavailable, next prayer, last-valid fallback. Cached badge only accompanies visible Hijri date and `isStale`; same-date fallback can be treated non-stale despite different context. If no next prayer is calculable, the UI says calculating rather than explicit empty.
- **Files/dependencies:** `features/prayer-times/{model,service,calculation}.ts`, actual service `features/islamic/islamicService.ts`, `stores/prayerTimesStore.ts`, `features/prayer-times/components/PrayerTimesContextItem.tsx`, settings, cache, diagnostics, timezone formatting and serialization.
- **Disposition:** Preserve optional/off-default behavior, methods, schedule, Hijri and timezone calculation; adapt backup identity/freshness and lighthouse/HTML presentation. No notification, sound, Qibla or Ramadan feature exists.

## F13 — preferences, persistence and data management

- **Behavior/data:** Five-tab Preferences drawer with automatic device-local saves. General: location, units, clock format. Content: topics/market visibility/company selection. Appearance: motion, glass opacity slider (UI 0.50–0.85), comfortable/compact density and reduced motion. Optional: currency/prayer/Hijri/full schedule/methods. Data & Privacy: source disclosures, cache clearing, provider-secret explanation and reset defaults. Provider modal supplies status/check/clear; it has no API-key input.
- **Refresh/interactions:** Lazy-loaded on first open; Escape/backdrop/close/Done, tab arrow/Home/End controls, source `<details>`, focus containment/return and body-scroll lock in source. Clear cached data calls generic cache clear plus market clear; reset settings only restores settings. Changes trigger only fingerprint-dependent providers.
- **States/limits:** Loading lazy module uses null Suspense fallback. Currency list fallback described above; market provider status and button disabling. No independent settings save-progress/error UI; storage exceptions are logged and application continues. Generic clear does **not** clear prayer last-valid backup keys, alert dismissals, or all mounted domain state. Density has confirmed skeleton consumers; loaded-density behavior is incomplete.
- **Files/dependencies:** `components/settings/*`, `stores/{settingsStore,settingsDefaults,settingsMigration}.ts`, `types/settings.ts`, `lib/validation/schemas.ts`, cache, market/currency state.
- **Disposition:** Preserve functioning settings/data controls and migration; adapt appearance/density meaning only through explicit future specification. Existing keyboard source code is not evidence that all focus cases pass in runtime.

## F14 — connectivity, refresh and last-valid continuity

- **Behavior/data:** Manual global refresh with spinner/disabled header control; online/offline tracking; partial summary `n/m refreshed`; cached-data aggregation. Header renders connection status only for offline/partial, even though controller also models online/cached/refreshing. Last-good information remains where domain policy allows.
- **Refresh/interactions:** Sequential enabled providers; minute stale checks while visible; reconnect/visibility stale checks; selective settings invalidation; stop/offline abort. Manual refresh does not generate new news/market upstream data or dispatch Actions. No offline application install/service-worker shell.
- **States/limits:** Offline summary says cached data even if no domain cache exists. A global summary cannot replace per-value truthfulness; partial market results may count as successful provider refresh, and prior manual summary persists until another manual refresh. Direct individual market action bypasses coordinator sequencing.
- **Files/dependencies:** `app/{useAmbientBriefController,refreshCoordinator}.ts`, `components/header/ClockHeader.tsx`, domain hooks/stores, browser connectivity/visibility events.
- **Disposition:** Preserve coordinator outside the world and keep usable refresh controls; adapt aggregate status and provenance without making camera activity drive data requests.

## F15 — application crash recovery

- **Behavior/data:** Top-level React ErrorBoundary shows a generic production failure and Reload Ambient View; error detail only in development; logs error and component stack.
- **Refresh/interactions:** Reload retries whole page. Not a provider loader and does not catch all asynchronous failures.
- **States:** Normal children or fatal render fallback; no feature-level renderer recovery boundary yet.
- **Files/dependencies:** `components/common/ErrorBoundary.tsx`, `app/AppProviders.tsx`, browser reload.
- **Disposition:** Preserve whole-app recovery; add separately scoped world/chunk/asset isolation so canvas failure does not remove essential HTML.

## F16 — explicit development tools (not production product features)

- **Behavior/data:** Lazy DEV-only tools include width/breakpoint indicator, visual state presets, weather/news/market state selectors, atmosphere time/weather overrides, alert severity and restoration, API diagnostics with response/cache/error metadata, and demo toggle/banner/reset to live. Mock constants are authored local data, not production feeds.
- **Refresh/interactions:** Dev store changes are immediate for consumers; domain state overrides may require the next refresh to be read. Demo weather fallback applies on failure, rather than providing a fully independent demo universe. Production settings restore/update forces demo off and excludes DevTools module.
- **States/limits:** Market dev status has no consumer in `useMarkets`, so the control does not actually override market data. AQI/currency/prayer are not all simulated by demo mode despite the broad banner wording. Development diagnostics coverage varies by provider.
- **Files/dependencies:** `components/common/{DevTools,DevStateSwitcher,ScreenWidthIndicator,ApiDiagnosticsDrawer}.tsx`, `stores/devStateStore.ts`, diagnostics store, `mocks/ambientData.ts`, DEV branches in hooks/settings.
- **Disposition:** Retain development-only isolation; adapt reliable simulation tools in later scope. Never use current demo controls as evidence every failure state has been browser-tested.

## Coverage and migration summary

Sixteen inventory entries cover clock/calendar/location, weather/forecast/alerts, atmosphere/daylight/UV, news, markets, AQI, currency, prayer/Hijri, preferences/data controls, connectivity, crash recovery, and developer tooling. Each entry includes states, interactions, dependencies and disposition. Four world stations are future presentation groupings; they do not reduce this functional scope to four widgets.

There are no existing Overview/Journey/Ambient modes, island navigation, login, backend, account sync, push alerts, news article reader, stock trading or currency calculator. Do not imply these exist. Use [the audit migration matrix](../specs/01-existing-system-audit.md#3-reuse-and-replacement-recommendations) for reusable/presentation/dead-code candidates and the [risk register](../specs/01-existing-system-audit.md#5-ranked-risks) for integrity gaps requiring decisions. All file paths in feature entries are relative to `src/` unless explicitly prefixed `scripts/` or `.github/`.
