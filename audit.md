# Ambient Brief repository audit

The repository is not ready for production API work. The production build succeeds, but type-checking and tests fail, multiple production paths can present simulated or misattributed data, and the supported desktop sizes require substantial scrolling.

No repository files were modified. `git status` still shows only the pre-existing untracked `AGENTS.md`.

## Verification results

| Check | Result |
|---|---|
| Install | `npm install --ignore-scripts --package-lock=false` hung without output and was stopped. Existing dependencies are complete according to `npm ls --depth=0`. |
| Typecheck / declared `lint` | Failed with 2 incompatible `NewsArticle`/`Headline` errors. |
| ESLint | Not available: there is no ESLint configuration and `lint` only runs TypeScript. |
| Tests | 55 passed, 3 failed. All failures concern timezone-dependent atmospheric calculations. |
| Production build | Passed, written outside the repository. JS bundle is 899.62 KB / 268.05 KB gzip. |
| Browser runtime | App loaded; weather eventually succeeded. GDELT failed initially, currency requests failed repeatedly, and news fallback behavior caused incorrect attribution. |
| Responsive inspection | Overflow at 1366×768, 1440×900, 1920×1080, and 2560×1080. Only 3440×1440 fit without vertical overflow. |

## Critical

### 1. Mock contextual values are always rendered as production data

- Relevant files: [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:23), [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:323), [ContextBar.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/context-bar/ContextBar.tsx:141), [ambientData.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/mocks/ambientData.ts:289)
- Evidence: both context bars receive `CONTEXT_BAR_MOCK`; UV, sunset countdown, and “Last refreshed” are rendered directly from it. Browser inspection showed `UV 5`, `Sunset in 5h 54m`, and `Last refreshed 2:12 PM` while the clock was around 1:42 PM.
- User-visible consequence: fabricated contextual data is presented without a demo label and can even claim a future refresh time.
- Recommended fix: derive UV and sunset from normalized weather data, give every field an explicit provenance/status, and render `unavailable` until real data exists.
- Blocks later API work: **Yes.**

### 2. News fallback is recursive, can hang, and misattributes publishers

- Relevant files: [newsService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/newsService.ts:20), [guardianProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/providers/guardianProvider.ts:18), [mockProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/providers/mockProvider.ts:13)
- Evidence: `fetchNewsHeadlines()` calls `GuardianNewsProvider`; that provider calls `fetchNewsArticles()`, which calls `fetchNewsHeadlines()` again. When a later nested GDELT attempt succeeded, Guardian rewrote every article’s `publisherDomain` to `theguardian.com`. Browser output consequently labeled High Plains Journal, Niagara Falls Review, and Yahoo Finance links as “The Guardian.”
- User-visible consequence: the panel can remain loading indefinitely during persistent GDELT failure, generate repeated requests, or display false source attribution.
- Recommended fix: implement Guardian as an independent adapter calling its documented endpoint; prohibit providers from calling the orchestration service; return unavailable when all live providers fail.
- Blocks later API work: **Yes.**

### 3. News silently falls back to mock stories in normal production mode

- Relevant files: [newsService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/newsService.ts:46), [useNews.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/hooks/useNews.ts:125), [ambientData.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/mocks/ambientData.ts:118)
- Evidence: the service unconditionally returns `mockProvider` after provider failures. The hook then treats those results as `loaded`, regardless of `isDemoMode`.
- User-visible consequence: invented Reuters/AP/Bloomberg-looking headlines may be displayed as current news with no demo disclosure.
- Recommended fix: remove mock fallback from the production provider chain. Demo data must require explicit demo mode and carry `status: 'demo'` through the domain model and UI.
- Blocks later API work: **Yes.**

### 4. Markets can mix fabricated instruments into a “loaded” live result

- Relevant files: [useMarkets.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/markets/hooks/useMarkets.ts:8), [useMarkets.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/markets/hooks/useMarkets.ts:172)
- Evidence: hard-coded instruments claim `source: 'Alpha Vantage'`, `dataStatus: 'end-of-day'`, and receive a current `fetchedAt`. If either returned group is empty, the loaded state substitutes these static arrays. Several proxy prices resemble underlying index levels rather than SPY/DIA/QQQ prices.
- User-visible consequence: simulated prices can appear beside genuine quotes and be labeled as provider-sourced end-of-day data.
- Recommended fix: never fill missing live groups with static values. Preserve per-instrument provenance and render unavailable/partial states.
- Blocks later API work: **Yes.**

### 5. Both responsive ContextBar copies mount and request data simultaneously

- Relevant files: [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:322), [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:329), [ContextBar.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/context-bar/ContextBar.tsx:33)
- Evidence: CSS hides one copy visually, but React mounts both. Each instantiates AQI, currency, storage, and document listeners. React Strict Mode magnifies this; the console recorded four near-simultaneous failed USD/BDT requests.
- User-visible consequence: duplicate network traffic, flickering state, wasted quotas, and inconsistent diagnostics.
- Recommended fix: render one ContextBar and reposition it with grid/CSS, or select exactly one layout branch using a shared responsive layout mechanism.
- Blocks later API work: **Yes.**

## High

### 6. The repository fails its declared type check

- Relevant files: [NewsPanel.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/news/NewsPanel.tsx:194), [index.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/types/index.ts:118), [newsProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/providers/newsProvider.ts:3)
- Evidence: `NewsArticle.publisherDomain` is optional, while `Headline.publisherDomain` is required. `NewsPanel` passes `NewsArticle` data into components requiring `Headline`.
- User-visible consequence: CI/typecheck cannot pass; the current model allows UI/provider contracts to drift.
- Recommended fix: define a single normalized news-domain type with explicit provenance and make provider response types private to adapters.
- Blocks later API work: **Yes.**

### 7. Most provider responses bypass runtime validation

- Relevant files: [gdeltProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/providers/gdeltProvider.ts:59), [alphaVantageService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/markets/alphaVantageService.ts:188), [nwsAlertsProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/providers/nwsAlertsProvider.ts:13), [islamicService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/islamic/islamicService.ts:128), [useCurrencyStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useCurrencyStore.ts:48)
- Evidence: pervasive `any`, unchecked `response.json()`, and direct casts. Only Open-Meteo weather/AQI and geocoding have meaningful Zod schemas.
- User-visible consequence: provider schema changes can produce false defaults, invalid dates, runtime exceptions, or corrupt caches.
- Recommended fix: add adapter-local Zod schemas for every external response and normalize only validated data.
- Blocks later API work: **Yes.**

### 8. The default currency pair is unsupported in observed runtime

- Relevant files: [useSettingsStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useSettingsStore.ts:32), [useCurrencyStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useCurrencyStore.ts:100), [README.md](/Users/ahossain/Documents/GitHub/ambient-brief/README.md:50)
- Evidence: default is USD/BDT; runtime repeatedly returned “Currency unavailable.” README documents `api.frankfurter.app`, while code calls `api.frankfurter.dev`.
- User-visible consequence: a default-enabled contextual feature fails on first load.
- Recommended fix: populate pairs exclusively from the provider’s supported currency list; disable unsupported defaults and align documentation with the actual endpoint.
- Blocks later API work: **Yes, for currency.**

### 9. Clock and date ignore the selected location’s timezone

- Relevant files: [ClockHeader.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/header/ClockHeader.tsx:22), [ClockHeader.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/header/ClockHeader.tsx:40)
- Evidence: `Intl.DateTimeFormat` does not receive `activeLocation.timezone`. Location is displayed beside browser-local time.
- User-visible consequence: travelers and remote-location dashboards see a clock/date that does not correspond to the named location.
- Recommended fix: explicitly choose and label the clock timezone—preferably active-location time—and test DST/date-boundary behavior.
- Blocks later API work: **No**, but blocks trustworthy time-sensitive UI.

### 10. Timezone tests are environment-dependent and failing

- Relevant files: [atmosphericCalculator.test.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/utils/__tests__/atmosphericCalculator.test.ts:8), [atmosphericCalculator.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/utils/atmosphericCalculator.ts:79)
- Evidence: three tests use ISO strings without `Z`, making the instant depend on the machine timezone. Expected morning/day/sunset values failed.
- User-visible consequence: background state can be wrong around sunrise and sunset, and CI results vary by runner timezone.
- Recommended fix: use absolute UTC instants in tests and explicitly test browser timezone versus location timezone.
- Blocks later API work: **No**, but blocks reliable CI.

### 11. Freshness diagnostics update timestamps on failed or merely started requests

- Relevant files: [nwsAlertsProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/providers/nwsAlertsProvider.ts:55), [useIslamicStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useIslamicStore.ts:77), [useIslamicStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useIslamicStore.ts:151)
- Evidence: diagnostics assign `lastFetchedAt` for loading and error updates. Prayer fallback records stale-cache recovery as `success`.
- User-visible consequence: diagnostics can suggest recent successful data when the request failed.
- Recommended fix: separate `lastAttemptedAt`, `lastSuccessfulAt`, `sourceFetchedAt`, and `displayedAt`; never advance successful freshness on failure.
- Blocks later API work: **Yes.**

### 12. Cached NWS alerts are displayed without a cached/stale disclosure

- Relevant files: [useNWSAlerts.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/hooks/useNWSAlerts.ts:175), [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:196)
- Evidence: on failure the hook loads cached alerts into the same `alerts` array; the component receives no provenance or stale state.
- User-visible consequence: safety-critical warnings may appear current even when the live NWS request failed.
- Recommended fix: model alert state as a discriminated union with `live/cached/stale/unavailable`, cache timestamps, and visible disclosure.
- Blocks later API work: **Yes.**

### 13. Supported desktop sizes do not fit the intended ambient layout

- Relevant files: [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:213), [index.css](/Users/ahossain/Documents/GitHub/ambient-brief/src/index.css:152)
- Evidence: measured heights were 1172 px at 1366×768, 1238 px at 1440×900, and 1275 px at 1920×1080. At 1366×768, news and markets were largely below the fold.
- User-visible consequence: the glanceable dashboard requires scrolling at every named standard resolution.
- Recommended fix: use one height-aware grid, keep weather concise, constrain internal panels, remove duplicate context layout, and validate all required resolutions using automated screenshots.
- Blocks later API work: **No.**

### 14. API-key handling exposes keys more broadly than necessary

- Relevant files: [useSettingsStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useSettingsStore.ts:83), [alphaVantageService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/markets/alphaVantageService.ts:103), [env.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/config/env.ts:16)
- Evidence: keys are persisted in localStorage, optional `VITE_*` keys are bundled publicly, and Alpha Vantage keys are interpolated into query URLs. Symbols and keys are not URL-encoded.
- User-visible consequence: keys are visible to scripts, browser tooling, URL inspection, and any XSS that reaches the origin.
- Recommended fix: do not support developer-owned secrets in the SPA. If personal keys remain, clearly constrain them, encode parameters, avoid embedding defaults, and consider a no-key widget/provider.
- Blocks later API work: **Yes, for authenticated providers.**

### 15. Location state and reverse-geocoding assumptions are misleading

- Relevant files: [useSettingsStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useSettingsStore.ts:19), [useAppLocation.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/hooks/useAppLocation.ts:71)
- Evidence: defaults say `useCurrentLocation: true` while active location is a saved Upper Darby record and no permission is requested. Device timezone is used for GPS results rather than resolving the coordinate’s timezone. Nominatim is called directly without schema validation or the shared client.
- User-visible consequence: settings can imply GPS is active when it is not; timezone can be wrong near timezone boundaries or when device location is spoofed.
- Recommended fix: default to saved location, request geolocation only explicitly, resolve timezone from coordinate-aware provider data, and validate reverse-geocode responses.
- Blocks later API work: **Yes, because location keys all domain caches.**

### 16. Weather objects contain invented fallback values

- Relevant files: [openMeteoWeatherProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/providers/openMeteoWeatherProvider.ts:142), [openMeteoWeatherProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/providers/openMeteoWeatherProvider.ts:156), [openMeteoWeatherProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/providers/openMeteoWeatherProvider.ts:184)
- Evidence: absent UV becomes `4`, sunrise/sunset become `06:00 AM`/`08:00 PM`, and AQI is always assigned `22` inside otherwise-live weather data.
- User-visible consequence: missing provider data becomes plausible-looking production data.
- Recommended fix: use nullable normalized fields and explicit unavailable states. AQI must only originate from the AQ provider.
- Blocks later API work: **Yes.**

### 17. Visibility refresh ignores actual freshness

- Relevant files: [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:86), [useVisibilityRefresh.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/hooks/useVisibilityRefresh.ts:1)
- Evidence: every `isStale` callback returns `true`; returning to the tab refreshes all domains regardless of TTL. NWS also has its own polling and visibility refresh.
- User-visible consequence: unnecessary bursts, duplicate work, and higher quota/rate-limit risk.
- Recommended fix: expose domain freshness from hooks, centralize visibility refresh, and let one scheduler coordinate policies.
- Blocks later API work: **Yes.**

## Medium

### 18. ESLint is installed but not configured or run

- Relevant files: [package.json](/Users/ahossain/Documents/GitHub/ambient-brief/package.json:7), [tsconfig.json](/Users/ahossain/Documents/GitHub/ambient-brief/tsconfig.json:1)
- Evidence: `lint` is `tsc --noEmit`; there is no ESLint config. TypeScript also permits JS, unused locals/parameters, and skips library checks.
- User-visible consequence: unsafe casts, hook issues, dead imports, and accessibility mistakes receive no automated enforcement.
- Recommended fix: add flat ESLint configuration and distinct `typecheck`, `lint`, `test`, and `build` scripts.
- Blocks later API work: **Partially.**

### 19. Settings and caches are only partially validated

- Relevant files: [schemas.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/validation/schemas.ts:24), [useSettingsStore.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/stores/useSettingsStore.ts:57), [cacheService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/api/cacheService.ts:51)
- Evidence: `isDemoMode` is omitted from the settings schema and is stripped after reload; categories are arbitrary strings rather than `NewsCategory`; cached generic payloads are cast without domain validation.
- User-visible consequence: settings fail to persist consistently and malformed/outdated cache data can enter UI types.
- Recommended fix: version and migrate settings, infer TypeScript types from Zod schemas, and validate each cached domain payload on read.
- Blocks later API work: **Yes.**

### 20. Component and service architecture contains substantial dead duplication

- Relevant files: [Header.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/header/Header.tsx:1), [AppHeader.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/header/AppHeader.tsx:1), [currencyService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/currency/currencyService.ts:1), [marketsService.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/markets/marketsService.ts:1)
- Evidence: multiple unused headers, preview cards, a mock-only currency service, legacy market service, cache manager, clock hook, prayer section, and feasibility runner.
- User-visible consequence: duplicated behavior drifts and obscures the active architecture.
- Recommended fix: remove unreferenced prototypes after confirming intent; keep one component and one adapter path per feature.
- Blocks later API work: **Partially.**

### 21. Several components are oversized and mix unrelated responsibilities

- Relevant files: [SettingsDrawer.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/settings/SettingsDrawer.tsx:78), [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx:28), [ContextBar.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/context-bar/ContextBar.tsx:33)
- Evidence: SettingsDrawer is 836 lines; App coordinates every provider plus timer logic; ContextBar owns AQI, currency, prayer, popovers, and data presentation.
- User-visible consequence: regressions become likely, and small changes trigger broad rerenders.
- Recommended fix: split settings by feature, move orchestration to domain hooks/controllers, and make ContextBar a composition of small status-aware items.
- Blocks later API work: **Partially.**

### 22. Dependency and lockfile hygiene is poor

- Relevant files: [package.json](/Users/ahossain/Documents/GitHub/ambient-brief/package.json:13), [package-lock.json](/Users/ahossain/Documents/GitHub/ambient-brief/package-lock.json:1), [bun.lock](/Users/ahossain/Documents/GitHub/ambient-brief/bun.lock:1)
- Evidence: unused runtime dependencies include `@google/genai`, `express`, and `dotenv`; `@types/express` is unnecessary. Vite appears in both dependency groups. Two lockfiles resolve different tool versions.
- User-visible consequence: larger install surface, unclear package-manager authority, and non-reproducible local/CI environments.
- Recommended fix: choose npm or Bun, remove the other lockfile, remove unused packages, and classify build tools as dev dependencies.
- Blocks later API work: **No.**

### 23. Bundle and visual effects are heavier than needed

- Relevant files: [AtmosphericBackground.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/background/AtmosphericBackground.tsx:208), [index.css](/Users/ahossain/Documents/GitHub/ambient-brief/src/index.css:96), [SettingsDrawer.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/settings/SettingsDrawer.tsx:1)
- Evidence: single 899.62 KB JS chunk, eager settings/diagnostics code, Recharts, Motion, multiple huge blurred layers with perpetual `will-change`, SVG turbulence, and widespread backdrop filters.
- User-visible consequence: slower initial load and sustained GPU/battery usage for an app intended to stay open.
- Recommended fix: lazy-load drawers, evaluate lighter sparklines, remove permanent `will-change`, simplify blur/noise layers, and profile long-running GPU usage.
- Blocks later API work: **No.**

### 24. Accessibility coverage is incomplete

- Relevant files: [ClockHeader.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/header/ClockHeader.tsx:71), [ContextBar.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/context-bar/ContextBar.tsx:115), [SettingsDrawer.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/settings/SettingsDrawer.tsx:235)
- Evidence: runtime DOM had no `h1`; AQ/currency popovers lack dialog/menu semantics, Escape handling, and focus management; several toggle groups do not expose selected state; some controls remove focus outlines without adding a visible replacement.
- User-visible consequence: keyboard and screen-reader users receive an incomplete page hierarchy and fragile popover behavior.
- Recommended fix: add a single page-level heading, use semantic toggle groups, implement popover focus/Escape behavior, and run axe plus keyboard-only tests.
- Blocks later API work: **No.**

### 25. Remote news URLs are insufficiently constrained

- Relevant files: [gdeltProvider.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/providers/gdeltProvider.ts:17), [FeaturedStory.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/news/FeaturedStory.tsx:12)
- Evidence: both `http:` and `https:` article/image URLs are accepted. Arbitrary publisher images are hotlinked directly, although `noopener`, `noreferrer`, and `referrerPolicy` are correctly used.
- User-visible consequence: HTTP resources fail on HTTPS Pages deployments; remote media still permits tracking and broken layouts.
- Recommended fix: require HTTPS, validate URL length/host policy, use robust image-error fallbacks, or omit untrusted remote imagery.
- Blocks later API work: **Partially.**

### 26. GitHub Pages deployment is not configured

- Relevant files: [vite.config.ts](/Users/ahossain/Documents/GitHub/ambient-brief/vite.config.ts:6), [index.html](/Users/ahossain/Documents/GitHub/ambient-brief/index.html:1), [.gitignore](/Users/ahossain/Documents/GitHub/ambient-brief/.gitignore:1)
- Evidence: there is no `.github/workflows`, Pages action, `CNAME`, or documented deployment procedure. `base: './'` is likely workable for relative assets, but has no automated verification. `.gitignore` omits `dist`, `.env*`, coverage, logs, and editor artifacts.
- User-visible consequence: deployment is manual and easy to break or accidentally contaminate with build/secrets files.
- Recommended fix: add a tested Pages workflow, explicit base strategy, artifact build check, expanded ignore rules, and deployment documentation.
- Blocks later API work: **No**, but blocks reliable release.

## Low

### 27. Product metadata and documentation are stale

- Relevant files: [index.html](/Users/ahossain/Documents/GitHub/ambient-brief/index.html:6), [README.md](/Users/ahossain/Documents/GitHub/ambient-brief/README.md:9), [package.json](/Users/ahossain/Documents/GitHub/ambient-brief/package.json:2)
- Evidence: browser title is “My Google AI Studio App,” package name is `react-example`, README says React 18 while the repository uses React 19, and provider claims exceed the implementation.
- User-visible consequence: unfinished branding and misleading setup expectations.
- Recommended fix: update title, package metadata, stack versions, provider limitations, and truthful data-status documentation.
- Blocks later API work: **No.**

### 28. No meaningful public assets exist

- Relevant files: [metadata.json](/Users/ahossain/Documents/GitHub/ambient-brief/metadata.json:1), [index.html](/Users/ahossain/Documents/GitHub/ambient-brief/index.html:1)
- Evidence: there is no `public/` folder; `assets/` only contains an AI Studio ignore file. No favicon, social metadata, manifest, or app icons exist.
- User-visible consequence: generic browser/deployment appearance.
- Recommended fix: add intentional lightweight brand assets after the functional foundation is stable.
- Blocks later API work: **No.**

### 29. Several utility implementations duplicate one another

- Relevant files: [useSystemClock.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/hooks/useSystemClock.ts:1), [dateUtils.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/lib/formatting/dateUtils.ts:1), [useWeather.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/weather/hooks/useWeather.ts:175), [useNews.ts](/Users/ahossain/Documents/GitHub/ambient-brief/src/features/news/hooks/useNews.ts:167)
- Evidence: clock timers and relative-time formatters are repeated.
- User-visible consequence: inconsistent formatting and future timezone drift.
- Recommended fix: centralize location-aware time formatting and freshness labels.
- Blocks later API work: **No.**

### 30. Generated-code residue remains

- Relevant files: [vite.config.ts](/Users/ahossain/Documents/GitHub/ambient-brief/vite.config.ts:15), [src/App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/App.tsx:1)
- Evidence: AI Studio-specific HMR comments, mojibake (`modifyâfile`), redundant App wrappers, permissive compiler options, and obsolete “legacy compatibility” fields.
- User-visible consequence: low immediate impact, but poorer maintainability.
- Recommended fix: clean generated comments/wrappers after behavior is stabilized.
- Blocks later API work: **No.**

## Product hierarchy assessment

The prominent clock is visually successful, but it is not location-time-aware. Weather occupies the full width at standard desktop sizes and pushes news/markets below the fold, so it is not as concise as intended. News and contextual data currently have the most serious integrity problems. Markets default to a setup panel and cannot fulfill the fourth hierarchy level without a personal key. Prayer information is correctly disabled by default, but its cache and timestamp handling require hardening before release.

## Phased remediation plan

### Phase 0 — Stop false data

1. Remove unconditional context, news, market, weather, and currency mock paths from production.
2. Add one shared provenance model: `live | delayed | end-of-day | cached | stale | unavailable | demo`.
3. Fix news recursion and source attribution.
4. Stop timestamps from advancing after failed requests.
5. Ensure cached NWS alerts and all demo data are visibly labeled.

### Phase 1 — Restore a trustworthy engineering baseline

1. Fix the news type error and timezone tests.
2. Add real ESLint, `typecheck`, CI, and one authoritative lockfile.
3. Add Zod schemas for every provider and every persisted/cache record.
4. Split provider response types from normalized domain types.
5. Remove `any`, unchecked casts, and invented defaults.

### Phase 2 — Stabilize provider architecture

1. Create independent, replaceable adapters for weather, AQI, alerts, news, currency, prayer, and markets.
2. Centralize polling, visibility refresh, cancellation, TTL, and diagnostics.
3. Render only one ContextBar.
4. Resolve currency-provider support and choose a viable no-key market display.
5. Remove frontend handling of developer-owned secrets.

### Phase 3 — Repair layout and accessibility

1. Rebuild the desktop grid around 1366×768 first.
2. Keep clock dominant, compress weather, and keep news/markets/context visible without page scrolling.
3. Add automated screenshots for every required resolution.
4. Add heading hierarchy, keyboard-visible focus, semantic toggles, and accessible popovers/dialogs.
5. Verify reduced-motion behavior and long-running GPU usage.

### Phase 4 — Production deployment and polish

1. Add GitHub Pages CI/deployment, accurate base-path handling, and release checks.
2. Improve `.gitignore` and environment documentation.
3. Remove unused dependencies, dead prototype components, and generated residue.
4. Lazy-load secondary UI and reduce the initial bundle.
5. Update branding, README, favicon, attribution, and truthful provider/freshness disclosures.

Repaired the Ambient Brief project foundation without redesigning the UI or adding providers.

### Problems fixed

- Added working `dev`, `build`, `typecheck`, `lint`, and `test` scripts.
- Established npm as the sole package manager and verified clean `npm ci`.
- Removed Bun lockfile and unused direct dependencies.
- Added ESLint flat configuration with TypeScript and React Hooks checks.
- Tightened strict TypeScript, unused-symbol, casing, fallthrough, and library checks.
- Removed explicit `any`, unsafe compatibility casts, and unused imports.
- Added Zod validation for NWS, AlAdhan, Alpha Vantage, settings, and cache boundaries.
- Unified incompatible news types.
- Removed recursive Guardian orchestration and production mock fallback.
- Made demo mode development-only and forced it off in production.
- Excluded development controls from production artifacts.
- Removed required Guardian/environment-key handling. Alpha Vantage remains optional and does not block startup.
- Confirmed there is no OpenWeather key requirement.
- Removed simulated contextual production values and duplicate `ContextBar` mounting.
- Repaired the application-level error boundary with a production-safe fallback.
- Added automatic GitHub Pages base-path handling and deployment workflow.
- Added optional-only `.env.example`.
- Fixed timezone-dependent tests.
- Updated README, metadata, page title, and ignore rules.
- Removed unused prototype components, services, caches, and provider modules.

### Files changed

Core configuration and documentation:

- [package.json](/Users/ahossain/Documents/GitHub/ambient-brief/package.json)
- [package-lock.json](/Users/ahossain/Documents/GitHub/ambient-brief/package-lock.json)
- [tsconfig.json](/Users/ahossain/Documents/GitHub/ambient-brief/tsconfig.json)
- [vite.config.ts](/Users/ahossain/Documents/GitHub/ambient-brief/vite.config.ts)
- [eslint.config.js](/Users/ahossain/Documents/GitHub/ambient-brief/eslint.config.js)
- [.env.example](/Users/ahossain/Documents/GitHub/ambient-brief/.env.example)
- [.gitignore](/Users/ahossain/Documents/GitHub/ambient-brief/.gitignore)
- [README.md](/Users/ahossain/Documents/GitHub/ambient-brief/README.md)
- [deploy-pages.yml](/Users/ahossain/Documents/GitHub/ambient-brief/.github/workflows/deploy-pages.yml)
- [index.html](/Users/ahossain/Documents/GitHub/ambient-brief/index.html)
- [metadata.json](/Users/ahossain/Documents/GitHub/ambient-brief/metadata.json)

Application structure and safety:

- [App.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/app/App.tsx)
- [ErrorBoundary.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/common/ErrorBoundary.tsx)
- [DevTools.tsx](/Users/ahossain/Documents/GitHub/ambient-brief/src/components/common/DevTools.tsx)
- Context bar, settings, weather, news, markets, AQI, diagnostics, and store modules.
- Provider schemas and adapters for NWS, AlAdhan, Alpha Vantage, and Open-Meteo AQI.
- Atmospheric timezone tests and shared domain/settings types.

Removed:

- `bun.lock`
- Unused header and preview components.
- Legacy currency/market/cache services.
- Recursive Guardian and mock news providers.
- Obsolete feasibility and mock-data modules.
- Frontend environment-key configuration.

The supplied `audit.md` and `AGENTS.md` were not modified.

### Commands run

- `npm install`
- `npm ci --no-audit --no-fund`
- `npm run typecheck` — passed
- `npm run lint` — passed with zero warnings
- `npm run test` — 58/58 passed
- `npm run build` — passed
- `BASE_PATH=/ambient-brief/ npm run build` — passed; generated asset paths use `/ambient-brief/`
- `git diff --check` — passed
- Production artifact scan — no development-control or mock-data signatures found

### Remaining blockers

- The production JavaScript bundle is still approximately 892 KB and triggers Vite’s chunk-size warning. Bundle optimization was left out because it is not a build blocker and could require broader component-loading changes.
- Layout, accessibility, live-provider reliability, and remaining data-integrity work from the audit are intentionally outside this foundation-only task.
- Vitest emits Node’s experimental local-storage warning, but all tests pass.