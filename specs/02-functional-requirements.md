# Living World — functional requirements

Status: **draft**, version **0.1**, 2026-11-02; approval pending. Part of [00 — Product vision](00-product-vision.md). E/V/N labels, priorities and approval boundaries are defined there. All source behavior below is audit/source evidence, not a new runtime verification. New modes, presentation and safeguards are proposed N requirements under the approved V direction.

## Shared feature-state contract

**FS-01 (P0, E+N; F01–F16, R01–R04/R06/R09).** Every feature must apply the following states where relevant. A state must have text or an accessible name; color, scenery, spinner or tooltip alone is insufficient. Disabled controls must explain their condition in nearby text. Disclosure buttons expose expanded/selected state; controls have visible hover, focus and disabled treatments. Normal data has a stable reading position during refresh.

| State | Required treatment |
| --- | --- |
| Loading, no valid value | Labeled placeholder/skeleton of bounded size; never plausible numeric filler; controls needed for recovery stay usable |
| Refreshing with valid same-context value | Keep value and original source/freshness; show checking separately; never blank the whole island |
| Empty | Successful response with no content is explicitly empty; never conflate with request failure |
| Cached | Show cached origin and known age/source; cache access is not a new observation |
| Stale | Keep only validated same-context information allowed by domain retention; visible stale/last-known qualifier accompanies the value |
| Partial | Label missing/retained values individually and describe overall partial result; successful siblings remain usable |
| Error/unavailable | Explain affected domain, preserve valid fallback if allowed, offer existing retry/global refresh/settings action; never use zero/mock replacement |
| Disabled/unsupported | No request for optional disabled domains; settings explains how to enable. Unsupported provider coverage is distinct from no active data |
| Context changing | New label/unit/pair/method may not decorate old values; use matching cache or loading/unavailable until the new context validates |

The per-feature entries below specify exceptions and state applicability. Error and stale can coexist. Partial is a content dimension, not a replacement for per-value age. The data vocabulary and exact freshness/context rules are in [06](06-data-and-interactions.md).

## Overview mode

**OV-01 — Entry, composition and stability (P0 basic / P1 world, V+N).** Initial load/reload enters Overview with essential HTML available while the world loads. Frame the island from a composed three-quarter aerial view with observatory, lighthouse, signal station and pavilion recognizable. The camera stays fixed while reading, refreshing, hovering, changing topics or expanding details. No initial fly-in, idle orbit, scroll camera movement or automatic tour. Data/time changes may affect lighting, not viewpoint.

**OV-02 — Persistent summary (P0, E+V+N).** The following must remain readable in Overview, Journey and Ambient at the four desktop sizes plus proposed ultrawide size. “Persistent” permits a modal to overlay underlying content while open, but no automatic concealment or required Journey navigation. Disabled optional readings are omitted without empty numeric space.

1. Primary clock with seconds, date, selected location and time-format context.
2. Concise current temperature/unit and condition, feels-like and high/low, deterministic short insight; weather status alongside it.
3. Highest-priority undismissed active alert, if any; otherwise compact alert-check availability rather than a false all-clear.
4. News active topic controls, one featured headline and at least two secondary headline links, publisher/age and feed state; explicit category/feed empty or unavailable state instead when applicable.
5. If markets enabled, all three ETF proxy readings and at least one selected company reading with USD/change, proxy labels, snapshot/source age and partial/stale cue. All other selected companies are reachable in a same-mode disclosure; they are not removed.
6. AQI category/value or unknown, UV risk/value, sunset; currency pair/reference value if enabled; next prayer/time/countdown and Hijri date if enabled/requested and available. These remain subordinate to time/weather/news.
7. Global connection/refresh status and immediately reachable Preferences, Refresh, mode and station controls. Ambient may reveal secondary controls under AM-02, but keeps an always-visible exit/control entry point.

If an alert or unusually long text competes for room, reduce optional descriptions/images and world area before reducing required readings or type legibility. Detailed forecast, pollutant values, full story list, all companies and prayer schedule may use bounded local panels. [IN-05/IN-09](06-data-and-interactions.md) govern scroll/zoom adaptations.

**OV-03 — Information access and landmarks (P0 HTML / P1 scene, V+N).** An HTML station control opens that station's detail panel without moving the Overview camera. A matching landmark pointer selection does the same. A distinct, explicitly labeled “Visit in Journey” action initiates travel. Hover/focus may identify a landmark but never moves the camera or reveals exclusive data. Panel close preserves topic/selection and returns focus to its invoker. All four physical landmarks remain even when prayer/markets/currency are off; disabled services have no fabricated activity or readings.

**OV-04 — Refresh, alerts and exits (P0, E+N).** Background refresh updates values in place without reordering focus, scrolling panels to top or camera activity. Manual refresh has bounded feedback and a per-domain result; “checked published snapshot” must not imply new upstream data. Alerts use IN-07. Enter Journey or Ambient only through an explicit control; returning to Overview restores the fixed composition and retains data/settings, with no refetch caused solely by mode change.

## Journey mode

**JY-01 — Chapters and entry (P0 controls / P1 motion, V+N).** Default sequence: Overview vantage → Observatory → Lighthouse → Signal station → Market pavilion → Return to Overview. Explicit station entry starts at that station. Chapter labels and Previous/Next/direct station controls are always available; selecting the final return leaves Journey. Optional content being disabled does not remove/reindex a physical chapter: the pavilion still offers enabled currency or a local settings explanation, and the lighthouse always supplies time/date. A chapter is information exploration, not a mandatory timed slideshow.

**JY-02 — Guided navigation (P0 direct / P1 scroll, V+N).** Only the labeled Journey exploration region owns scroll camera progress. Scroll traverses adjacent guided paths and settles on a chapter after input stops; details remain readable at rest. Do not require a precise gesture, drag or continued wheel movement to hold a station view. Clicking a landmark or HTML station control directly targets it and cancels an older movement. Persistent summary and direct controls remain usable throughout. No free-roam/orbit, momentum drift after settling, scroll hijack outside that region, or forced traversal of intervening panels.

**JY-03 — Interruption, return and modal behavior (P0, N).** Latest explicit navigation intent wins. Stop motion, Escape, mode change, opening a modal, hiding the tab, reduced-motion activation and renderer failure cancel current camera work under IN-02/IN-04. Back within Journey goes to the previous completed chapter; it is not browser Back. A persistent Return to Overview action works from any chapter or interrupted pose, closes station details and returns focus to the Overview control. Closing a modal never automatically resumes a trip.

**JY-04 — Accessible navigation and state (P0, N).** Enter/Space on labeled controls does everything a landmark click can do. Previous/Next chapter controls support touch taps and keyboard; arrow/Home/End behavior is scoped to the chapter navigation group. Announce settled station/chapter once, not each animation frame. Direct navigation focuses the destination heading when settled (immediately with motion off); scroll-driven change keeps focus where the user left it and announces the settled chapter politely. No focusable mesh text is required. Browser URL/history remains unchanged; reloading starts Overview. IN-03/IN-08 define focus and history details.

## Ambient mode

**AM-01 — Deliberate quiet mode (P0 basic / P1 composition, V+N).** Manual entry from Overview or Journey returns to a stable wide island composition and closes station panels; it retains data, topics and optional settings. No automatic idle entry, auto-exit, touring or disappearing information. OV-02 remains visible, including headlines and financial/context readings. Ambient is a work companion, not a screensaver.

**AM-02 — Receding controls and manual exit (P0, N).** After 10 seconds without interaction and with focus outside secondary controls, de-emphasize secondary navigation and tool chrome. Do not dim data below contrast requirements, hide a focused control or remove keyboard access. Keep a visible “Exit Ambient / Controls” entry and alert access. Pointer movement, focus entry or a touch on Controls restores controls immediately; data links remain actionable on the first deliberate tap. Exit Ambient or Escape outside a dialog returns Overview; interaction alone does not exit. A dialog's Escape closes only that dialog first.

**AM-03 — Animation and long-running behavior (P0 policy / P1 world, E+N).** Camera remains fixed. Living permits bounded environmental loops; Subtle reduces their amplitude/frequency; Static or effective reduced motion stops continuous decoration and animated travel. No forced weather flashes or pulsing numbers. Pause decorative rendering when hidden; resume at current time/state without replaying elapsed animation or requests. Domain refresh remains coordinator-owned and mode-independent. Use 8-hour visible and hide/resume acceptance in 08.

**AM-04 — Refresh and critical events (P0, N).** Keep compact connection and per-domain freshness indicators visible even when tools recede. Routine success is quiet; failed/partial checks qualify affected values. Severe/Extreme NWS alerts become a persistent readable banner and reveal relevant controls; they do not auto-exit Ambient, take focus, make sound or open a modal. Current data remains visible when cached; unavailable data stays explicitly unavailable. Reduced-motion Ambient retains the same summaries, controls and manual exit.

## F01–F16 requirements traceability matrix

Every row preserves the audited capability; details and exceptions follow. Continuous means OV-02 in all modes, subject to enablement; contextual means locally accessible in every mode without mandatory travel. Risks refer to the audit register.

| Baseline | Requirement | Living World presentation | Visibility / equivalent access | Risks | Verification |
| --- | --- | --- | --- | --- | --- |
| F01 clock/date/location | FR-01 | Lighthouse identity + primary HTML clock | Continuous; HTML Preferences/Refresh | R01/R03/R06 | AC-F01 |
| F02 location | FR-02 | Preferences → General, current location beside clock | Identity continuous, editor contextual; keyboard result list/touch confirmation | R01/R02/R11 | AC-F02 |
| F03 current weather | FR-03 | Observatory summary and detail | Summary continuous; disclosure/retry/settings via HTML | R01/R03/R09 | AC-F03 |
| F04 hourly/precipitation | FR-04 | Observatory forecast disclosure | Contextual same-mode forecast; button expansion | R01/R03/R06 | AC-F04 |
| F05 official alerts | FR-05 | Observatory alert signal + global HTML banner/dialog | Active priority alert continuous; detail/dismiss buttons | R02/R03/R04 | AC-F05 |
| F06 atmosphere/daylight | FR-06 | Whole island light/weather; fallback atmosphere | Decorative continuous, settings contextual; static equivalent | R03/R05/R06 | AC-F06 |
| F07 news | FR-07 | Signal station + HTML headlines/topic panel | Selected summary continuous; topics/more/customize/links | R03/R07/R08/R11 | AC-F07 |
| F08 markets | FR-08 | Pavilion + proxy/company HTML readings | Enabled summary continuous; remaining companies/check/context | R03/R04/R07/R08 | AC-F08 |
| F09 AQI | FR-09 | Observatory context and pollutant disclosure | AQI continuous; detail button/Escape/outside close | R03/R06/R09 | AC-F09 |
| F10 UV/sunset | FR-10 | Observatory UV, lighthouse daylight context | Continuous HTML; no invented detail control | R01/R03 | AC-F10 |
| F11 currency | FR-11 | Pavilion reference + selector/details | Enabled reading continuous; searchable selectors and details | R01/R03/R04/R08/R09 | AC-F11 |
| F12 prayer/Hijri | FR-12 | Lighthouse next prayer + expandable schedule | Enabled next/Hijri continuous; schedule when preference permits | R01/R03/R04/R09 | AC-F12 |
| F13 preferences/privacy | FR-13 | Global HTML drawer and provider dialog | Contextual in every mode; trapped/restored focus, touch buttons | R01/R06/R09/R11/R13 | AC-F13 |
| F14 connectivity/refresh | FR-14 | Persistent global status + domain indicators | Continuous feedback; global/provider HTML refresh controls | R03/R04/R07/R08 | AC-F14 |
| F15 crash recovery | FR-15 | Essential HTML recovery + isolated world fallback | Contextual error actions; keyboard/tap Reload/Retry | R05/R06/R10/R12 | AC-F15 |
| F16 dev diagnostics | FR-16 | Development-only tools beside world/HTML | DEV-only controls/diagnostics; production excluded | R03/R10/R13 | AC-F16 |

## Feature contracts

### FR-01 — Clock, calendar and location identity

**P0, E preservation; N access safeguards.** Preserve device-clock-derived seconds, 12/24-hour formatting, calendar date and selected-location IANA timezone. Keep compact location label, full label on accessible detail/focus as well as hover, and device-location identity. Preferences and global refresh remain HTML controls. No network time sync is claimed. Source: [ClockHeader](../src/components/header/ClockHeader.tsx), [useClock](../src/features/clock/useClock.ts), formatting and settings defaults.

There is no remote loading/cache state for the device clock. An invalid/missing restored timezone must not crash the display or silently claim the wrong locality; show a disclosed fallback timezone and offer location correction (N, DI-02). Seconds are not a live region. Network offline does not stop the clock. Timezone/time-format changes update all relevant labels together. Keyboard/touch opens Preferences without visiting the lighthouse. Provenance: device clock + selected/disclosed timezone, not “live provider.” Acceptance: AC-F01, AC-I01.

### FR-02 — Manual and consented device location

**P0, E; N context safety/disclosure.** Preserve Upper Darby default, restored validated selection, Open-Meteo search (minimum two characters, 300 ms debounce, up to eight displayed results), pending selection and explicit Use location/Cancel, clear search/reset, Use/Refresh device location. Preserve query cancellation and Arrow keys/Enter selection; touch results still require confirmation. Request geolocation only from explicit user action; no continuous watch, permission on startup or implicit refresh from camera travel.

Show idle/searching/results/empty/error and device loading/denied/unavailable/timeout/unsupported errors in General preferences. Failures preserve the active manual/default choice. Reverse-naming failure retains coordinates as My Location and unknown country, which does not enable NWS. Browser-derived device timezone remains disclosed context; do not claim timezone lookup from GPS. Explain coordinate transfers to relevant providers. Confirmation initiates DI-02's atomic presentation-context change; cancellation initiates none. Search metadata cache/partial states are not a new feature; no persisted result cache is required. Active location identity is continuous; editor contextual. Provenance: selection source, coordinates internally, timezone and country/unknown. Sources: [location settings](../src/components/settings/LocationSettingsSection.tsx), [useAppLocation](../src/hooks/useAppLocation.ts). Acceptance: AC-F02, AC-I01, AC-S02.

### FR-03 — Current weather and concise insight

**P0, E; N truthful projection.** Preserve temperature, condition, feels-like, high/low, humidity/wind disclosure, requested Fahrenheit/Celsius and mph/km/h, deterministic summary and AQI ≥101 emphasis. Observatory details may open from HTML or landmark in Overview without moving camera. Retry/global refresh and location settings remain reachable by keyboard/tap.

Apply FS-01 loading, same-context cached/stale and unavailable states. Whole-response empty/partial series is a validation failure, not fair weather; nullable UV is handled independently by FR-10. Device permission denial in location settings does not replace otherwise valid weather for a manual/default location; a forced development weather state is labeled development. Unit/location changes must not temporarily relabel old values (IG-01). Continuous summary; humidity/wind contextual. Provenance: Open-Meteo, units, location, known successful fetch/cache age; observation time unknown if absent. A “loaded” hook is not proof of live observation. Source: [weather model](../src/features/weather/model.ts), weather service/provider/hook. Acceptance: AC-F03, AC-I01/AC-I03.

### FR-04 — Hourly forecast and precipitation

**P0, E.** Keep next eight normalized hours, six initially in forecast details, expandable to eight and back. Preserve local 12/24-hour labels from retained ISO-local strings, temperature/condition and precipitation probability display at ≥15%, emphasis at ≥40%. No additional forecast provider or separate polling is added. Same-mode HTML Full forecast/Compact view buttons support keyboard/touch and expose expansion.

Forecast inherits weather loading/cache/error, context and source age. Empty/misaligned required series invalidates the payload; do not invent hours. It has no independent enabled state or loading request. Contextual observatory disclosure remains available in every mode. Source: [HourlyForecast](../src/features/weather/components/HourlyForecast.tsx). Acceptance: AC-F04, AC-I01.

### FR-05 — Official weather alerts

**P0, E content/dismissal; N availability/lifecycle/escalation.** Keep US-only official NWS alerts, severity/urgency order, active/test/cancel filtering, full event/headline/area/description/instructions/timing/issuer/source, previous/next buttons and per-ID dismissal retained through expiry/end. Do not add custom warning content. Highest undismissed alert is global HTML; station signaling is supplementary. Detail/dismiss actions support keyboard and tap, modal Escape and focus return. Previous/next work as buttons without requiring new global arrow shortcuts.

Distinguish checking, confirmed none, active, cached/stale active, unavailable and unsupported/unknown country; current UI conflation is explicitly corrected. Expired/location-mismatched alerts cannot remain visible or animate the island (IG-02). No cached data is an unavailable check, not “no alerts.” Provider-disabled session behavior is disclosed, with existing diagnostics/reload route; no unofficial proxy or automatic polling escalation. Cached official alerts display their age and remaining validity. Source: [useNWSAlerts](../src/features/weather/hooks/useNWSAlerts.ts), NWS provider, alert modal/banner. Acceptance: AC-F05, AC-I02, AC-N04.

### FR-06 — Atmosphere and daylight

**P0 fallback/motion; P1 world (E+V+N).** Replace the CSS atmosphere's primary presentation with the cohesive island after approval while retaining usable static/DOM fallback. Preserve selected-location local-time and weather/daylight inputs and Living/Subtle/Static/reduced-motion settings. Light and environmental activity can evolve without camera movement or fetches. Condition grouping is stylized, not measured rain/wind/AQI simulation. EN-01–EN-04 govern unknown/stale/neutral semantics.

No invented numeric scene readings or active weather from an unavailable source. Cached weather may influence last-known atmosphere with a visible qualifier; unusable context becomes neutral. Static scene/image/loading/failure states leave HTML intact. Hover effects have focus equivalents; no environmental interaction is essential. Source: [atmosphericCalculator](../src/features/weather/utils/atmosphericCalculator.ts). Acceptance: AC-F06, AC-E01, AC-P01–AC-P06.

### FR-07 — News and category customization

**P0, E; N stronger provenance.** Preserve Top, U.S., World, Business, Technology, Science, Sports, Entertainment; one to three selected preferences; locally selected active topic; featured and secondary stories; publisher, publication age and optional description/image. Preserve ranking/deduplication and no unrelated-category fill. Keep Customize/Manage, View additional stories/Show less, Retry and safe new-tab article links. In compact desktop summaries at least two secondary links remain; larger layouts may show the existing four. All available stories remain in local expansion.

Signal station topic controls/links/disclosures work by focus/Enter/tap without scene navigation. Skeleton, valid-empty feed, active-category-empty, error, cached/delayed and partial feed are distinct; missing/broken/blocked images use a placeholder with no loss of headline link. Keep URL guards, lazy/async images, no-referrer and noopener/noreferrer. Static JSON only; browser refresh never invokes Currents or Actions. Provenance: Currents scheduled feed, feed generated/source-fetch times, story publisher/publishedAt; carried partial buckets have unknown category-refresh age. No false per-story refresh timestamp. Source: [NewsPanel](../src/features/news/components/NewsPanel.tsx), news hook/schemas/provider. Acceptance: AC-F07, AC-I03, AC-S01.

### FR-08 — Market snapshots and company selection

**P0, E; N cancel/provenance safeguards.** Preserve SPY/S&P 500 ETF proxy, DIA/Dow ETF proxy and QQQ/Nasdaq-100 ETF proxy, USD prices and nullable absolute/percentage changes; six supported companies AAPL/MSFT/NVDA/AMZN/GOOGL/META and selection of one to six. Broad proxy labels must be visible in summaries and details; ETF prices must not be presented as index levels. Company choices only affect display, not upstream quote generation. Enabled readings live in the pavilion and persistent summary; additional selected rows are accessible in a same-mode panel.

Keep panel/global/provider-dialog checks, already-current versus checked feedback, market cache clear, estimated session and source/generated age. Keyboard/touch equivalents use HTML controls. FS-01 loading, cached, stale, partial/missing-symbol, unavailable and last-valid failed-check notice apply. Missing price/change never becomes zero; a hidden market panel makes no routine market requests. Market disable does not disable separately enabled currency. Partial values have row-specific stale/provider-time labels and cannot imply a fully successful refresh (IG-03/IG-04). No animation interpolates fabricated prices. Source: [MarketPanel](../src/features/markets/components/MarketPanel.tsx), [useMarkets](../src/features/markets/hooks/useMarkets.ts), snapshot contracts. Acceptance: AC-F08, AC-I03/AC-I04, AC-S01.

### FR-09 — AQI, pollutants and guidance

**P0, E; N compact freshness.** Preserve US AQI, deterministic category/general guidance, PM2.5/PM10/ozone in µg/m³ and available measurement time. Missing numeric AQI remains Unknown/-- even if pollutants exist; ≥101 still informs weather summary. Compact AQI plus freshness is continuous; pollutant/guidance details are an observatory popover with button/tap, close, outside click and Escape; opening does not move camera. Add focus containment only if rendered modal; otherwise maintain a clear Tab path and focus return.

Loading/unavailable/cached/stale and partial pollutants are explicit; null pollutant means unavailable, not zero. No independent retry is invented; global refresh remains reachable. Measured time without offset cannot be asserted as an exact instant without context (DI-03). AQI haze cannot replace readings or imply a new measured pollution value. Source: air-quality model/provider/hook and popover. Acceptance: AC-F09, AC-I03, AC-N03.

### FR-10 — UV and sunset

**P0, E; N context protection.** Preserve continuous UV number/risk and sunset in chosen location/time format, supplied by weather. They have no independent request, permission, toggle or detail panel. Missing UV/sunset is --/unavailable independently; weather cache/stale qualifier applies. Keyboard/touch can reach related observatory details through normal station controls, without inventing UV/daylight controls. Do not expose a new sunrise control or astronomy service; retained sunrise remains an internal daylight/prayer input. Provenance: weather source/location/timezone and fetch age. Acceptance: AC-F10, AC-I01/AC-E01.

### FR-11 — Optional currency reference

**P0, E; N identity/TTL safeguards.** Preserve currency enablement, saved default USD/BDT, searchable separate base/quote selectors excluding equal pairs, pair label and reference value, and details equation/date/source/fetch time. Show as Frankfurter reference data, not intraday/live or a converter. Pavilion reading is continuous when enabled, selector/details contextual. Keyboard search/list selection and touch selection must be equivalent; no hover-only equation/source.

Rate and currency-list loading/failure are separate. A fallback list is names only and does not prove currency support or supply a rate. Unsupported/invalid pair or provider failure has unavailable/matching-cache state, never a guessed cross rate. During pair changes old numeric value cannot use the new pair label. Rate cache age must drive routine refresh (IG-04), with reference date preserved across weekends. Disabled rate requests stop. Provider v1 alias/base/BDT compatibility is unresolved; preserve provider ownership pending explicit review, not a silent v2 migration. Sources: [currency provider](../src/features/currency/providers/frankfurterProvider.ts), [currency store](../src/stores/currencyStore.ts). Acceptance: AC-F11, AC-I01/AC-I04, AC-O01.

### FR-12 — Optional prayer schedule and Hijri

**P0, E; N context/calendar/provenance safeguards.** Off by default. Preserve next prayer/time/minute countdown excluding sunrise; tomorrow Fajr after Isha; optional Hijri date; expandable six-row schedule including sunrise with past/next emphasis; ISNA/MWL/Egyptian/Karachi/Makkah and Standard/Hanafi Asr settings. Full-schedule preference enables its disclosure rather than forcing all rows open. Lighthouse HTML shows next prayer continuously when enabled, optional requested Hijri alongside; schedule stays contextual. Method/school/location/date are accessible beyond hover, especially beside retained data.

Calculating is only pending work, not an indefinite empty state. If no future valid next prayer exists, show unavailable with local date/context and refresh/settings access (N). Valid same-context/date fallback remains cached even with Hijri hidden; stale dates cannot produce a past “now” countdown. Today/tomorrow partial validity is explicit: valid future today may remain with tomorrow unavailable, but do not invent tomorrow Fajr. Method/school/location change invalidates old-context schedules (IG-01). Disabling hides all prayer/Hijri and stops provider work; no prayer sound, notification or theological precision guarantee. Sources: [prayer store](../src/stores/prayerTimesStore.ts), [calculation](../src/features/prayer-times/calculation.ts), prayer context item. Acceptance: AC-F12, AC-I01/AC-I03/AC-I04.

### FR-13 — Preferences, persistence and data/privacy controls

**P0, E; N explicit appearance/data semantics.** Keep lazy HTML Preferences with General, Content, Appearance, Optional, Data & Privacy; device-local automatic saves and existing schema-2 migration/defaults/production demo-off enforcement. Preserve all functioning controls listed in F13, source disclosures, read-only provider-secret explanation/status/check/clear, reset defaults and cache controls. No API-key input is introduced. Loading the drawer must show an accessible loading/error/retry state instead of an invisible null fallback (N). Storage failure must leave session changes usable and disclose inability to persist rather than falsely promise a saved result (N).

Retain Escape/backdrop/close/Done, body scroll lock, tab Arrow/Home/End, focus containment/return and nested provider-dialog behavior. Camera freezes when any modal opens; dialog scroll never moves the world. Source status/clear/check controls have honest loading/disabled/error feedback. Clear semantics are DI-09; reset defaults changes preferences, not a promised erasure of all data.

Appearance retains Living/Subtle/Static; glass 0.50–0.85 in 0.05 steps means panel opacity only and cannot reduce contrast below acceptance. Comfortable/Compact must affect loaded spacing and optional descriptions as well as skeletons (N correcting limited baseline). Neither setting removes mandatory summary values, selected companies or stories from access. Effective reduced motion is OS OR app setting; Static also disables continuous decoration and camera animation. No additional quality or mode persistence setting is silently added; any future one requires reviewed migration. Sources: [SettingsSections](../src/components/settings/SettingsSections.tsx), [SettingsDrawer](../src/components/settings/SettingsDrawer.tsx), settings store/defaults/migration. Acceptance: AC-F13, AC-D01, AC-N03, AC-S02.

### FR-14 — Connectivity, refresh and continuity

**P0, E; N honest aggregation/bounded recovery.** Keep online/offline tracking, global refresh disabled/spinning while active, enabled-provider sequencing/deduplication, visible minute stale scan, reconnect/visibility checks, selective settings invalidation and stop/offline cancellation. Preserve matching validated last-good data and provider-specific retry/check routes. No request is caused by mode, camera, hover or frame updates. Manual snapshot checks only read published files.

Global status stays readable in all modes and differentiates checking, cached/partial and offline/unavailable. “Offline · cached data” is only valid when retained values exist; otherwise say offline/data unavailable (N). Per-domain failed/cached/partial result remains discoverable; partial network markets is not “all refreshed.” Rechecking unchanged news/markets may update last-check time, never source-generation/observation time. IG-04 supplies bounded timeout/cancel and long-session correction requirements. No offline-installed app shell is promised. Source: [controller](../src/app/useAmbientBriefController.ts), [coordinator](../src/app/refreshCoordinator.ts). Acceptance: AC-F14, AC-I04, AC-N05.

### FR-15 — Error recovery

**P0, E whole-app recovery; N isolated world recovery.** Preserve top-level production-safe failure message and Reload Ambient View action, development-only error detail. Add world/chunk/asset/context-loss isolation: essential HTML and providers remain usable if the world fails; show a concise world-unavailable message, fallback and explicit Retry world control. No reload loop or automatic repeated asset download. A retry failure leaves the same usable fallback. Keyboard/touch works; failure during travel cancels movement and restores focus to a surviving HTML control. Whole-app fatal failure still offers reload; asynchronous provider errors remain domain states. Acceptance: AC-F15, AC-N06; risks R05/R06/R10/R12.

### FR-16 — Development diagnostics

**P0 environment preservation, E; N truthful diagnostics labels.** Retain DEV-only lazy width indicator, existing effective weather/news/atmosphere/alert overrides, API diagnostics, explicit demo toggle/banner/reset-to-live and live restoration. Keep production demo-off enforcement and exclusion of DevTools. Mock values must be labeled demo through both HTML and world semantics. Existing market override has no hook consumer and broad demo does not simulate all domains: do not promise those work or count them as acceptance evidence. Making those tools complete is deferred new scope, not an implementation prerequisite. Unsimulated failure cases require controlled fixtures/test harness during later verification. No diagnostics may expose keys or silently send data externally. Acceptance: AC-F16, AC-S01; source: DevTools/dev store/diagnostics and production settings guards.

## Change history

2026-11-02 — v0.1 draft. F01–F16 mapped, with preservation versus new safeguards explicit. No application behavior modified; no visual review or implementation acceptance claimed. [08](08-acceptance-criteria.md) owns verification and unresolved decisions.
