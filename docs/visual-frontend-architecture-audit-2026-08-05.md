# Ambient Brief visual and frontend architecture audit

Date: 2026-08-05  
Scope: current repository, four supplied current-state screenshots, and a locally rendered Vite development build  
Repository changes made during audit: this report only

## Executive summary

Ambient Brief has the right product ingredients and already limits the main dashboard to three dominant glass surfaces. The clock is appropriately prominent, provider code is increasingly feature-oriented, strict TypeScript/lint/tests pass, and the named desktop viewports can be forced into a single screen without document scrolling.

The current composition is nevertheless closer to a dark dashboard than an ambient information display. The layout fills height by stretching three nearly identical panels, while the content inside news and markets remains short and independently capped. That creates large empty fields, especially at 1920 px and wider. The atmospheric background is nearly imperceptible, the glass treatment is uniform, and indigo is used so broadly that the result reads as purple SaaS styling.

The highest-priority issue is a runtime failure. The live browser produced `TypeError: Illegal invocation` in `RefreshCoordinator.start()`. Initial data loading consequently remained in skeleton states throughout the local audit even though typecheck, lint, and all 116 tests passed. The supplied screenshots were therefore used as the primary evidence for loaded content, while the local browser run provided exact geometry, console, settings, and third-party-widget evidence.

The correct remediation direction is not to add more cards. It is to establish a height-aware composition with content-sized weather and market regions, a genuinely editorial news surface, a native market summary, and one quiet context rail over a visible atmospheric background.

## Audit method and evidence

- Inspected the React, TypeScript, CSS, settings, formatting, provider, and refresh architecture.
- Inspected all four supplied screenshots at original detail.
- Ran the Vite app locally at 1366×768, 1440×900, 1920×1080, 2560×1080, and 3440×1440.
- Captured rendered screenshots and DOM geometry at every requested viewport.
- Inspected the live DOM, computed layout, focus/heading structure, control target sizes, scripts, custom-element state, and browser console.
- Opened and measured the settings drawer at 1440×900.
- Ran `npm run typecheck`, `npm run lint`, and `npm test -- --run`.
- Did not run the production build because this was a no-modification audit and a build would create `dist` output.

## Verification results

| Check | Result |
| --- | --- |
| TypeScript | Pass |
| ESLint | Pass |
| Tests | 25 files, 116 tests passed |
| Browser console | Fail: two Strict Mode reports of `TypeError: Illegal invocation` from `RefreshCoordinator.start()` |
| Document overflow at requested sizes | No document-level overflow in the observed no-alert state |
| Live data completion | Fail: weather and news remained in loading skeletons because initial refresh failed |
| TradingView | Script loaded and custom element reached “ready,” but the visible tape showed symbol-availability errors |

## Viewport measurements

All measurements are CSS pixels from the local browser. The no-alert state was measured because the refresh failure prevented a live alert from loading. The supplied screenshots show the alert-present state.

| Viewport | App width / side gutter | Header height | Main grid height | Context height | Observed composition |
| --- | ---: | ---: | ---: | ---: | --- |
| 1366×768 | 1366 / 0 | 117 | 562 | 46 | Two columns; weather above markets on left; news spans both rows; compact-height rules active |
| 1440×900 | 1440 / 0 | 142 | 621 | 70 | Same two-column structure; compact-height rules turn off at exactly 900 px |
| 1920×1080 | 1880 / 20 | 152 | 790 | 70 | Three equal-height columns activate at the 1900 px breakpoint |
| 2560×1080 | 2200 / 180 | 152 | 790 | 70 | Three columns; 360 px of total canvas unused |
| 3440×1440 | 2400 / 520 | 152 | 1150 | 70 | Three columns; 1040 px of total canvas unused and all panels stretch to 1150 px |

The absence of page scrolling is not evidence that sizing is correct. At compact height, `height: 100dvh` plus `overflow: hidden` clips any content that exceeds the assigned tracks. At taller sizes, the grid consumes all remaining height and stretches intrinsically short panels, producing empty space.

## Detailed findings

### 1. Ultrawide canvas utilization

- **Severity:** High
- **Relevant file/component:** `src/app/App.tsx:24`; `.app-container`
- **Root cause:** A staircase of fixed maximum widths caps the app at 2200 px at 2560 and 2400 px at 3440. The background spans the viewport, but all information remains inside the capped centered column.
- **User-visible effect:** 2560×1080 leaves 180 px unused on each side; 3440×1440 leaves 520 px on each side. The clock and content feel like a centered web page floating in a monitor rather than an ambient canvas composed for the display.
- **Recommended fix:** Replace viewport-specific maximum widths with a fluid outer composition using bounded content measures per region. Allow the clock/background/context rail to use the full canvas while constraining readable news text locally. Use the extra width for spacing, scale, and editorial image treatment—not additional cards.
- **Fix type:** Structural

### 2. Standard desktop layout

- **Severity:** High
- **Relevant file/component:** `src/index.css:193-226`; `src/app/App.tsx:54-70`
- **Root cause:** At 1200–1899 px the grid assigns weather and markets to the left column and makes news span both rows. The second row is `minmax(180px, 1fr)`, so markets absorb all leftover height regardless of content. News also receives the combined height regardless of its internal 340 px cap.
- **User-visible effect:** At 1366 and 1440 the left column reads as two stacked dashboard cards while the right becomes a tall, mostly empty news card. The layout hierarchy is driven by track filling rather than information importance.
- **Recommended fix:** Define a desktop composition based on content roles: a compact time/weather lead, an editorial news field, a short native market strip, and a context rail. Let only the editorial field flex; keep weather and markets content-sized within explicit min/max bounds.
- **Fix type:** Structural

### 3. Fixed heights and viewport clamping

- **Severity:** High
- **Relevant file/component:** `src/index.css:255-378`; `.app-container`, `.hourly-forecast-container`, `.news-scroll-container`, `.stock-scroll-container`
- **Root cause:** Compact desktop sets `height: 100dvh` and `overflow: hidden`, while several children use pixel or viewport-subtraction maximum heights. These values encode one assumed header/context/content budget. An alert adds another grid row without a corresponding robust content budget.
- **User-visible effect:** Content may fit only because forecast rows or stories are hidden, internally scrolled, or clipped. A one-pixel height change from 899 to 900 switches the entire sizing strategy.
- **Recommended fix:** Use a single shell with `grid-template-rows: auto auto minmax(0, 1fr) auto`, propagate shrinkability through the content tree, and define intentional compact variants by available block size. Avoid `calc(100dvh - magic-number)` caps.
- **Fix type:** Structural

### 4. Flex and grid sizing

- **Severity:** High
- **Relevant file/component:** `src/app/App.tsx:24,54`; `src/index.css:194-253`; `MarketPanel.tsx:70-82`
- **Root cause:** `main` is `flex-grow`; its grid tracks use `1fr`; each card uses `h-full`; and the market widget shell uses `flex-1`. This chain guarantees vertical stretching even when the content is only about 150–300 px tall.
- **User-visible effect:** Weather, news, and markets become equally tall columns on wide screens. The ticker sits vertically centered in a large vacant panel, and the news content stays near the top of another vacant panel.
- **Recommended fix:** Choose one flex owner. Make the main composition the only height-distributing container, give content-sized modules `align-self:start`, and reserve `minmax(0,1fr)` for the one region that is designed to absorb space.
- **Fix type:** Structural

### 5. `min-height: 0` propagation

- **Severity:** Medium
- **Relevant file/component:** `src/index.css:216-221`; `NewsPanel.tsx:141-205`; `MarketPanel.tsx:70-114`
- **Root cause:** The three grid sections correctly receive `min-height: 0` on desktop, but shrinkability is not carried consistently through the cards and their flex children. News instead relies on a hard `max-height`; markets relies on an expanding `flex-1` shell. In the alert variant, content is suppressed rather than allowed to negotiate height.
- **User-visible effect:** The top-level grid can shrink, but inner content cannot respond compositionally. Overflow is resolved by hidden content and fixed scroll boxes rather than by a predictable internal layout.
- **Recommended fix:** Add `min-height: 0` to the actual flex children that own overflow, remove conflicting fixed caps, and explicitly select which child scrolls. Document this contract in shared panel primitives.
- **Fix type:** Structural

### 6. Overflow and clipping

- **Severity:** High
- **Relevant file/component:** `GlassSurface.tsx:23`; `src/index.css:256-260,283-285,400-415`; `NewsPanel.tsx:192`; `MarketPanel.tsx:81-82`
- **Root cause:** Every `GlassSurface` is `overflow-hidden`; compact desktop hides overflow on both the app and grid; news introduces a hidden-scrollbar scroll region; and TradingView descendants are forcibly `overflow:hidden`. Multiple ancestors can therefore clip the same content with no visible affordance.
- **User-visible effect:** The supplied 1440 screenshot shows a featured story beginning mid-content after internal scrolling, with no visible scrollbar explaining that state. The TradingView tape is cut mid-symbol. At compact height, overflow has no document-level recovery path.
- **Recommended fix:** Keep visual clipping limited to a decorative inner layer, not the semantic card root. Assign overflow to one named content viewport per module, show a subtle scroll affordance when scrolling is possible, and never combine page, grid, card, and widget clipping.
- **Fix type:** Structural

### 7. News card internal layout

- **Severity:** High
- **Relevant file/component:** `NewsPanel.tsx:141-205`; `StoryList.tsx:12-77`; `src/index.css:336-346,400-404`
- **Root cause:** The card is `h-full`, but the stories container is capped at 340 px (or 310 px at compact height). On compact-height desktop, CSS also hides every secondary story from the third onward. The container uses `no-scrollbar`, so its scroll state is invisible.
- **User-visible effect:** A 621–1150 px panel displays roughly 340 px of stories and leaves the rest blank. At 1366×768, only two secondary items are permitted even if space is available. Users can lose the featured title above the fold inside the card without realizing the card is internally scrolled.
- **Recommended fix:** Make the story region `min-height:0; flex:1; overflow:auto` only when the panel has a deliberate bounded height. Otherwise let stories size naturally. Replace nth-child hiding with a layout-controlled story count derived from a compact composition variant.
- **Fix type:** Structural

### 8. Featured-story hierarchy

- **Severity:** Medium
- **Relevant file/component:** `FeaturedStory.tsx:15-58`; `NewsPanel.tsx:147-189`
- **Root cause:** The featured story is rendered as another small inset dark card. Its title is only 16–18 px, its image is fixed at 144×112, and body text is capped at 70 characters per line. The category controls and freshness badge consume comparable visual weight.
- **User-visible effect:** The featured item does not function as the editorial anchor. In the supplied screenshots it is visually close to secondary rows and can be partially clipped, making “Top news” feel like a utility list.
- **Recommended fix:** Use a true lead-story composition: 24–32 px headline, stronger image ratio, restrained metadata, and one or two quieter secondary columns/rows. Move customization out of the primary reading line.
- **Fix type:** Visual (with a component-layout structural change)

### 9. Market panel implementation

- **Severity:** High
- **Relevant file/component:** `MarketPanel.tsx:69-115`; unused `MarketSkeleton.tsx`; unused `features/markets/hooks/useMarkets.ts`
- **Root cause:** The active market panel is only a third-party ticker tape inside a full-height card. A separate native market hook, Alpha Vantage adapter, and richer skeleton exist but are not connected to the active panel.
- **User-visible effect:** The “market summary” contains no stable native index hierarchy, no clearly owned loading/data states, and no useful content when the third-party tape fails. Most of the surface is empty.
- **Recommended fix:** Replace the tape-first card with a native-rendered summary backed by a replaceable normalized adapter. Show three indices and a small watchlist with explicit live/delayed/EOD/unavailable status. If no compliant keyless source exists, show an honest setup/unavailable state; keep TradingView as an optional link or secondary embed.
- **Fix type:** Structural

### 10. TradingView script and iframe behavior

- **Severity:** High
- **Relevant file/component:** `tradingViewWidget.ts:20-78`; `MarketPanel.tsx:26-65`; `src/index.css:168-185,410-415`
- **Root cause:** “Ready” means only that the custom element class was defined, not that symbols rendered successfully. The element uses nine comma-separated symbols, while the visible widget reported “This symbol is only available on TradingView.” Its 78 px tape is horizontally clipped by host and descendant overflow rules. The widget’s internal rendering is opaque to React and exposes no reliable content/error/resize contract.
- **User-visible effect:** The panel can report success while showing error tiles. Items are cut mid-tile, attribution dominates, and third-party behavior controls layout and legibility. The observed document also contained a hidden 0×0 TradingView datafeed iframe.
- **Recommended fix:** Remove the widget from the primary summary. If retained as an optional fallback, validate supported symbols, cap the symbol count by available width, expose a timeout/error state based on actual rendered content when possible, and isolate it in a content-sized region without `flex-1` vertical centering.
- **Fix type:** Structural

### 11. Empty vertical space

- **Severity:** High
- **Relevant file/component:** `.ambient-grid`, `NewsPanel`, `MarketPanel`, `WeatherHero`
- **Root cause:** Outer grid rows stretch to all available height while inner content is capped or intrinsically short. At 3440×1440 every primary panel is 1150 px tall even though weather content needs about 260 px and the tape 78 px.
- **User-visible effect:** Large dark voids dominate the composition. The layout feels unfinished and less glanceable, not calm.
- **Recommended fix:** Compose empty space intentionally around the clock/background, not inside outlined cards. Use content-sized surfaces and allow atmospheric negative space between modules. Let the editorial news region own the remaining height if needed.
- **Fix type:** Structural

### 12. Context-bar readability

- **Severity:** Medium
- **Relevant file/component:** `ContextBar.tsx:15-18`; `PrayerTimesContextItem.tsx:15-22`; `src/index.css:364-397`
- **Root cause:** The rail packs environment, finance, freshness, and prayer data into 9–12 px text. At compact height section headings disappear, reducing grouping. The third column has an intrinsic 220 px minimum, and optional prayer expansion becomes an absolutely positioned popup over the market card.
- **User-visible effect:** The rail is visually faint and difficult to scan from normal ambient-viewing distance. “Weather Live” is especially ambiguous, and expanded prayer content covers primary information.
- **Recommended fix:** Use 13–14 px minimum ambient text, stronger grouping and contrast, concise provenance labels, and a dedicated disclosure surface for optional detail. Keep the rail one line only when each group can remain semantically labeled.
- **Fix type:** Visual and structural

### 13. Weather-alert truncation

- **Severity:** High
- **Relevant file/component:** `WeatherAlertBanner.tsx:131-143`; `src/index.css:314-320`
- **Root cause:** The summary always uses one-line `truncate` and `max-w-xl` (roughly 576 px), even when much more width is available. Actions are fixed-width siblings. At compact height with an alert, the hourly forecast and divider are removed entirely to reclaim space.
- **User-visible effect:** The supplied screenshots cut off the NWS message after “Mount H…”, hiding timing and impact context. The alert also causes unrelated weather information to disappear.
- **Recommended fix:** Preserve a concise, authored alert summary with a two-line clamp and flexible width. Keep event, area, expiration, and source visible; put long NWS prose in the detail modal. Budget alert height in the shell rather than deleting forecast content.
- **Fix type:** Structural

### 14. Clock placement and typography

- **Severity:** Medium
- **Relevant file/component:** `ClockHeader.tsx:24-79`; `dateUtils.ts:11-38`; `src/index.css:245-247,271-280`
- **Root cause:** The clock uses browser-local time and date; the active location timezone is not passed to formatting. Its scale changes abruptly by media query, and on ultrawide it remains tied to the capped content column. Seconds and period are much lower-contrast than the main digits.
- **User-visible effect:** The clock is visually prominent but can be factually inconsistent with the named location. On ultrawide it feels small relative to the canvas, while seconds are hard to read at a distance.
- **Recommended fix:** Format clock and date explicitly in the active location timezone, expose the timezone in accessible text, use a fluid `clamp()` type scale, and position the clock as a canvas anchor independent of narrow editorial measures.
- **Fix type:** Structural and visual

### 15. Prayer-time formatting

- **Severity:** High
- **Relevant file/component:** `islamicService.ts:57-67,191-204`; `PrayerTimesContextItem.tsx:15-23`; `settingsDefaults.ts:32-39`
- **Root cause:** Provider times are normalized and stored as raw 24-hour `HH:mm` strings. The view prints those strings directly and lower-case identifiers are merely CSS-capitalized. The `showNextPrayer` preference is not checked by the component; only `enabled` is checked.
- **User-visible effect:** A globally selected 12-hour format can still show `18:05`; labels such as `asr`/`dhuhr` lack intentional product formatting; a supposedly disabled “next prayer” can remain visible.
- **Recommended fix:** Store timestamps as canonical data, format all prayer labels and times at render time through shared formatters, honor `showNextPrayer`, and use a display-name map (`Fajr`, `Dhuhr`, `Asr`, etc.).
- **Fix type:** Structural

### 16. Gregorian versus Hijri date presentation

- **Severity:** Medium
- **Relevant file/component:** `ClockHeader.tsx:30-32,60-63`; `PrayerTimesContextItem.tsx:21`; `islamicService.ts:171-178`
- **Root cause:** The header date is implicitly Gregorian but unlabeled, while Hijri appears as a raw provider string such as `22-02-1448` in a tiny context row. The stored richer Hijri month name is not used for presentation.
- **User-visible effect:** The two calendars have unequal hierarchy and ambiguous formats. Numeric `22-02-1448` can be mistaken for a Gregorian-style date.
- **Recommended fix:** Keep the Gregorian date with the clock as primary. When enabled, show a clearly labeled secondary Hijri date such as `22 Safar 1448 AH`; do not intermix raw numeric date formats.
- **Fix type:** Visual with formatting support

### 17. Global 12-hour/24-hour propagation

- **Severity:** High
- **Relevant file/component:** `dateUtils.ts`; `HourlyForecast.tsx:53-55`; `ContextBar.tsx:11-14`; `PrayerTimesContextItem.tsx`; `WeatherAlertModal.tsx:168-179`; diagnostics and AQI popovers
- **Root cause:** Clock, hourly forecast, and sunset consult the setting, but prayer times print raw strings. Alert modal, AQI observation time, diagnostics time, and several fallback timestamps use locale defaults independently.
- **User-visible effect:** The interface can mix `1:45 PM`, `18:05`, and locale-dependent `02:00 PM` within one dashboard despite a global preference.
- **Recommended fix:** Create one location-aware formatting service accepting timezone and `TimeFormat`. Route every user-visible absolute time through it; keep provider normalization separate from display formatting.
- **Fix type:** Structural

### 18. Settings information architecture

- **Severity:** High
- **Relevant file/component:** `SettingsDrawer.tsx:42-48`; `SettingsSections.tsx:24-145`
- **Root cause:** Nine sections and 44 interactive controls are presented as one uninterrupted column. Everyday display choices, content choices, optional modules, data-source disclosure, developer mode, and an advanced API key all share the same level. Changes persist immediately, but the footer says “Apply & Close,” implying a transaction that does not exist.
- **User-visible effect:** The drawer feels like a configuration form rather than a calm preferences surface. High-frequency options are hard to find and the action model is misleading.
- **Recommended fix:** Group into Display, Content, Location, and Advanced. Use progressive disclosure for optional prayer/provider settings, move data-source prose to an About view, and rename the footer action to “Done” unless changes are actually staged.
- **Fix type:** Structural

### 19. Settings scroll length

- **Severity:** High
- **Relevant file/component:** `SettingsDrawer.tsx:43`; `tokens.css:59-66`
- **Root cause:** At 1440×900 the drawer measured 2161 px of scroll content inside a 900 px viewport—2.4 viewport heights. The `no-scrollbar` class hides the only persistent cue that more settings exist. Header and footer are part of the scrolling content rather than sticky anchors.
- **User-visible effect:** Users must make a long, invisible scroll to reach provider information and the close/reset actions. The supplied screenshots show the top and bottom as effectively separate pages.
- **Recommended fix:** Keep the header and action bar sticky, expose a subtle scrollbar, reduce vertical repetition, and use collapsible/route-based subsections. Keep advanced provider configuration closed by default.
- **Fix type:** Structural

### 20. Visual-token consistency

- **Severity:** Medium
- **Relevant file/component:** `tokens.css:3-24`; Tailwind literals throughout components; `GlassSurface.tsx:24-26`
- **Root cause:** The token file defines only a small base set, while components independently choose indigo, slate, amber, rose, radii, opacity, shadow, and text sizes. The glass component overwrites the tokenized background with inline RGBA.
- **User-visible effect:** Similar controls and surfaces vary subtly, indigo becomes the default accent for unrelated meanings, and the product trends toward purple SaaS styling.
- **Recommended fix:** Define semantic tokens for canvas, primary/secondary surface, hairline, focus, information, warning, typography, radius, spacing, and elevation. Map Tailwind utilities to those tokens and reserve indigo for a deliberate role.
- **Fix type:** Visual foundation

### 21. Typography sizes and contrast

- **Severity:** High
- **Relevant file/component:** `ContextBar.tsx`; `MarketPanel.tsx:76-78,112-114`; `SettingsSections.tsx`; `tokens.css:10-13`
- **Root cause:** Important supporting information is frequently 9–11 px and uses `text-slate-500` or translucent slate over dark translucent surfaces. Many controls prioritize compactness over ambient viewing distance.
- **User-visible effect:** Market provenance, context labels, settings help, timestamps, and freshness state are difficult to read. Text that may be acceptable at desk distance fails the “open all day across the room” use case.
- **Recommended fix:** Establish an ambient type ramp with a 12 px absolute floor for legal/provenance text and 13–14 px for operational context; test contrast against the composited background, not only token hex values.
- **Fix type:** Visual

### 22. Background implementation

- **Severity:** Medium
- **Relevant file/component:** `AtmosphericBackground.tsx:72-88,95-229`; `src/index.css:14-166`
- **Root cause:** The background is placed at `z-index:-1` while `html/body` have an opaque background, making stacking fragile. Three blurred forms are capped at 750–900 px, so they do not scale with a 3440 px canvas. Most colors have very low alpha, and the overlying panels are 65% opaque.
- **User-visible effect:** Rendered screenshots are almost uniformly black; the intended time/weather atmosphere is barely perceptible and does not help compose the canvas.
- **Recommended fix:** Create an explicit isolated root stack: background at layer 0, content at layer 1. Scale atmospheric forms to canvas dimensions, reduce the number of permanent blur layers, and art-direct focal light to support—not compete with—the clock and lead story.
- **Fix type:** Structural and visual

### 23. Glass-surface implementation

- **Severity:** Medium
- **Relevant file/component:** `GlassSurface.tsx`; `tokens.css:27-39`
- **Root cause:** All primary cards share the same 24 px blur, 24 px radius, deep shadow, border, background hue, and specular line. The intensity setting changes only background opacity, not blur or highlight behavior. `transition-all` is applied to every surface.
- **User-visible effect:** The three modules read as identical dark cards rather than a composed hierarchy. The background is obscured, and expensive backdrop filtering is used even where a simple translucent field would suffice.
- **Recommended fix:** Provide at most three surface roles: hero/editorial glass, quiet utility glass, and borderless context. Tune opacity/blur together, reduce shadows, and transition only properties that actually need animation.
- **Fix type:** Visual foundation

### 24. Accessibility

- **Severity:** High
- **Relevant file/component:** `ClockHeader.tsx`; `SettingsSections.tsx`; `PrayerTimesContextItem.tsx`; `AirQualityContextItem.tsx`; `CurrencyContextItem.tsx`
- **Root cause:** The rendered page has no `h1`; the date is the first `h2`. Segmented controls do not expose `aria-pressed` or radio semantics. Several controls are smaller than the recommended 44×44 touch target (header buttons measured 38×38; prayer disclosure 40×15). Context popovers do not manage focus, and alert regions are not live-announced.
- **User-visible effect:** Screen-reader hierarchy begins with a date rather than the product/primary time context. Selection state can be unclear, keyboard focus can remain behind popovers, and small controls are difficult to acquire.
- **Recommended fix:** Add a single meaningful `h1` (visually hidden if necessary), implement radio/pressed semantics for segmented controls, enlarge hit areas, give popovers dialog/menu semantics with focus return, and run axe plus keyboard-only verification at each layout.
- **Fix type:** Structural

Positive evidence: buttons were named, global `:focus-visible` exists, the settings and alert dialogs include focus traps and Escape handling, and decorative background content is hidden from assistive technology.

### 25. Reduced-motion behavior

- **Severity:** Medium
- **Relevant file/component:** `src/index.css:96-159,187-191`; `tokens.css:47-56`; `AtmosphericBackground.tsx:61-70`; `GlassSurface.tsx:23`
- **Root cause:** OS reduced motion and the app setting are both supported, but implementation is duplicated. “Static” only pauses CSS animations; it does not disable color transitions or every hover/transform transition. Permanent `will-change` remains on large layers. Third-party TradingView motion cannot be controlled.
- **User-visible effect:** Users selecting Static can still receive transitions and widget motion; the browser may retain large compositor layers even when motion is paused.
- **Recommended fix:** Centralize a motion policy with CSS custom properties, remove permanent `will-change`, treat Static and OS reduced-motion as zero-motion modes, and remove/replace uncontrolled animated third-party content.
- **Fix type:** Structural and visual

### 26. Responsive breakpoints

- **Severity:** High
- **Relevant file/component:** `src/index.css:193-253,255-378,417-442`; `src/app/App.tsx:24`
- **Root cause:** Layout changes at 1200, 1900, exactly 2560, and exactly 3440, plus a separate height cutoff at 899. A 1920-wide display flips to a three-column layout only 20 px above the breakpoint; a 900 px height turns off all compact rules one pixel above 899.
- **User-visible effect:** Small window/chrome changes cause large composition jumps. Breakpoints correspond to named device widths rather than where content actually stops fitting.
- **Recommended fix:** Derive breakpoints from minimum viable region widths and available block size. Prefer container queries for news/market internals and test around each boundary (±1, ±16, and browser zoom), not only at exact device presets.
- **Fix type:** Structural

### 27. Component boundaries and ownership

- **Severity:** Low
- **Relevant file/component:** `SettingsSections.tsx`; alias stores under `src/lib/stores`; `MarketSkeleton.tsx`; `useMarkets.ts`
- **Root cause:** Main feature components are reasonably small, so excessive component splitting is not the primary problem. The weakness is inconsistent ownership: some modules import alias re-exports while others import canonical stores, four settings features share one dense file, and inactive market architecture remains beside the active widget path.
- **User-visible effect:** Behavior is harder to trace and dead paths make it unclear which architecture is authoritative, increasing regression risk.
- **Recommended fix:** Keep the useful feature-oriented boundaries, standardize canonical imports, colocate each settings subsection with its feature, and remove inactive market paths after the replacement is complete.
- **Fix type:** Structural

### 28. Development artifacts

- **Severity:** Medium
- **Relevant file/component:** `DevTools.tsx`; `ScreenWidthIndicator.tsx`; `DevStateSwitcher.tsx`; `settingsDefaults.ts:40`
- **Root cause:** Development tools are correctly excluded from production, but the viewport indicator defaults to enabled and the state switcher is always mounted in development. Both occupy the bottom-right visual field and can cover the context/prayer area.
- **User-visible effect:** Current-state screenshots include development chrome over the product, and the expanded toolbar can cover a large part of news/markets, complicating visual review.
- **Recommended fix:** Default all development overlays off, activate them through an explicit debug query/shortcut, and ensure visual-regression captures use a clean deterministic mode.
- **Fix type:** Structural

### 29. Runtime console errors

- **Severity:** Critical
- **Relevant file/component:** `refreshCoordinator.ts:55-69`; `useAmbientBriefController.ts:102-122`
- **Root cause:** The constructor stores `globalThis.setInterval` in `this.createInterval`, then calls `this.createInterval(...)`. In a browser this changes the function receiver from `window` to the coordinator instance, producing an illegal invocation. React Strict Mode reports it twice in development. Unit tests inject ordinary mock functions, so they do not exercise browser receiver semantics.
- **User-visible effect:** Initial refresh aborts and weather/news can stay in skeletons indefinitely. The dashboard reports “Online” while primary information remains unavailable.
- **Recommended fix:** Wrap host functions (`(...args) => globalThis.setInterval(...args)`) or call them with the correct receiver. Add a browser integration test that mounts the controller with real timer APIs and fails on console errors.
- **Fix type:** Structural

### 30. Layout shifts and performance

- **Severity:** High
- **Relevant file/component:** refresh orchestration; alert insertion in `App.tsx:54-61`; skeletons; `AtmosphericBackground`; `GlassSurface`; TradingView loader
- **Root cause:** The runtime error prevents representative loaded-state CLS measurement. Architecturally, alerts insert a new grid row after async load, cached/live content can replace skeletons, and settings change panel dimensions immediately. Large blurred layers use perpetual `will-change`; three large surfaces use backdrop filters; TradingView adds an external module/custom element; `transition-all` is widespread.
- **User-visible effect:** A successful load can move the entire dashboard when an alert appears. Long-running GPU/battery cost is disproportionate for an app intended to remain open all day, and third-party script timing can change market paint independently.
- **Recommended fix:** Fix runtime first, reserve alert space when alerts are being checked or animate only a non-layout overlay, match skeleton and loaded geometry, profile CLS/LCP/long tasks in a production build, remove permanent compositor hints, and establish a 30-minute idle CPU/GPU/battery test.
- **Fix type:** Structural and performance

## Root-cause map for observed clipping and sizing defects

| Observed defect | Direct cause | Owning fix |
| --- | --- | --- |
| Ultrawide side voids | App max-width ladder (`2200px`, `2400px`) | Fluid canvas shell |
| Tall empty news card | Grid stretches row; news content capped at 340 px | One height owner; flexible editorial content region |
| Tall empty market card | Grid and `h-full` stretch card; ticker wrapper is `flex-1 items-center` around a 78 px widget | Content-size native market module |
| Featured story starts mid-card | Independently scrollable news region with hidden scrollbar; parent clips overflow | Single visible overflow owner and scroll affordance |
| Secondary stories disappear at compact height | CSS hides `.story-list-item:nth-child(n+3)` | Compact composition controls item count explicitly |
| TradingView item cut mid-tile | Host and every descendant forced to `overflow:hidden`; widget content wider than host | Remove primary widget or bound supported items |
| Alert message ends with ellipsis | One-line `truncate` plus `max-w-xl` | Flexible two-line structured summary |
| Forecast disappears when alert exists | Compact alert CSS sets forecast and divider to `display:none` | Allocate alert height without deleting unrelated content |
| Settings continuation is invisible | 2161 px scroll content plus `no-scrollbar`; non-sticky actions | Sectioned IA, sticky shell, visible scroll cue |
| Prayer details cover markets/context | Absolutely positioned schedule popup anchored above a 220 px context item | Dedicated disclosure/popover with collision handling |

## Staged remediation plan

### Stage 1 — Layout correctness

1. Fix the refresh coordinator timer receiver bug and add a browser integration test; layout cannot be validated while primary modules are permanently loading.
2. Replace the app/max-width ladder and current flex/grid height chain with one explicit canvas shell.
3. Establish a single overflow owner per module and propagate `min-height:0` to it.
4. Remove magic viewport-subtraction heights, nth-child hiding, and blanket semantic-card clipping.
5. Validate loaded, cached, error, alert, no-alert, prayer-on, prayer-off, and settings-open states at all five requested sizes.

**Exit criteria:** no unexpected clipping; no document scroll at normal desktop heights; no hidden content used merely to make the viewport fit; zero console errors.

### Stage 2 — Design-system foundation

1. Define semantic color, surface, type, spacing, radius, focus, and motion tokens.
2. Establish an ambient type ramp and minimum contrast/size rules.
3. Define three surface roles and remove arbitrary component-level color/opacity decisions.
4. Replace indigo-as-default with a restrained neutral palette plus semantic accents.

**Exit criteria:** each visual value maps to a documented role; component states are consistent; context text is readable at ambient distance.

### Stage 3 — Ambient background and glass

1. Repair the root stacking model so the background reliably paints above the canvas color and below content.
2. Art-direct time/weather states with scalable focal light rather than capped generic blobs.
3. Reduce permanent blur/compositor layers and tune glass opacity and blur as a pair.
4. Verify Living, Subtle, Static, and OS reduced-motion modes.

**Exit criteria:** the background is visibly atmospheric without reducing legibility; Static produces no ambient motion; idle resource use is acceptable.

### Stage 4 — Main dashboard composition

1. Treat the clock/location as a canvas anchor, with location-aware timezone formatting.
2. Make weather concise and content-sized.
3. Reserve one editorial region for news rather than stretching every panel equally.
4. Turn the bottom context area into a readable, stable rail with deliberate optional-module behavior.
5. Integrate alerts without deleting forecast content or shifting the complete composition unexpectedly.

**Exit criteria:** visual hierarchy matches time → weather/alert → news → markets → context at every target size.

### Stage 5 — News redesign

1. Create a true lead story with larger headline and meaningful image treatment.
2. Use quieter secondary stories with consistent metadata.
3. Remove the fixed 340 px cap and hidden scrollbar; choose either natural height or one explicit panel scroll region.
4. Move customization out of the primary editorial row.
5. Verify long titles, missing images, empty categories, cached freshness, and at least ten stories.

**Exit criteria:** the lead story is unmistakable, no story begins partially clipped, and unused panel space is minimal.

### Stage 6 — Market replacement

1. Define a normalized native market domain model with value, change, session/status, source, and freshness.
2. Connect the existing replaceable adapter path or another documented compliant provider.
3. Render three primary indices plus a compact watchlist natively.
4. Show honest delayed/EOD/unavailable/setup states; never substitute realistic demo values in production.
5. Remove the TradingView tape from the primary composition and retire dead market paths.

**Exit criteria:** market content remains legible and correctly labeled without iframe/custom-element layout dependence.

### Stage 7 — Prayer and date formatting

1. Build one timezone-aware time/date formatter used by clock, weather, alerts, prayer, AQI, currency freshness, and diagnostics.
2. Render prayer times from timestamps according to the global 12/24-hour setting.
3. Honor `showNextPrayer`; format prayer names intentionally.
4. Present Gregorian as primary and Hijri as a clearly labeled optional secondary date.
5. Verify day-boundary, DST, and tomorrow-Fajr transitions.

**Exit criteria:** no mixed time conventions and no ambiguous calendar formats.

### Stage 8 — Settings redesign

1. Restructure into Display, Content, Location, and Advanced.
2. Use progressive disclosure for prayer details, data providers, and personal API keys.
3. Keep header/actions sticky, expose scroll position, and rename “Apply & Close” to match immediate persistence.
4. Add correct selection semantics and target sizes.

**Exit criteria:** common settings are reachable in one viewport; advanced settings do not dominate; action behavior is truthful.

### Stage 9 — Responsive and accessibility verification

1. Add screenshot regression coverage at 1366×768, 1440×900, 1920×1080, 2560×1080, and 3440×1440 plus ±1/±16 px breakpoint probes.
2. Test browser zoom at 125%, 150%, and 200%; test long location/news text.
3. Run axe, keyboard-only, screen-reader heading/landmark, focus-return, and target-size checks.
4. Measure production CLS, LCP, long tasks, memory, and 30-minute idle CPU/GPU behavior.
5. Run both OS and in-app reduced-motion scenarios and confirm external widgets cannot reintroduce motion.

**Exit criteria:** zero serious accessibility violations, zero unexpected horizontal overflow, stable composition across transitions, and documented performance budgets.

## Recommended implementation order within Stage 1

1. `RefreshCoordinator` timer fix and browser-level regression test.
2. App shell and grid rewrite.
3. News overflow correction.
4. Market height correction pending Stage 6 replacement.
5. Alert height/truncation correction.
6. Context and prayer collision correction.
7. Full viewport/state screenshot matrix.

This order prevents visual work from being tuned against skeleton-only, clipped, or third-party-controlled geometry.
