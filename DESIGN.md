# Ambient Brief 2.0 — Living World design system

Status: **draft for visual review**, v0.1, 2026-11-02. This document specifies the proposed Living World visual system; it becomes visual authority only after approval. It does not change the incumbent [dashboard system](docs/design-system.md), select a renderer, authorize implementation, or amend data contracts.

The user confirmed **temperate Atlantic coast** in this design session: pale limestone, weathered cedar, dark bronze, wind-shaped pines and blue-green water. That choice and the requested island direction are approved inputs; the detailed compositions, tokens and asset allocations below are proposals. The request calls the product/functional specifications approved, but their files still record draft/approval pending. Use them as the requested baseline without rewriting their approval history; reconcile that record before implementation.

## Authority, purpose and traceability

Read [product vision](specs/00-product-vision.md), [functional requirements](specs/02-functional-requirements.md), [data/interactions](specs/06-data-and-interactions.md) and [acceptance](specs/08-acceptance-criteria.md) alongside this document. [World and art](specs/04-world-and-art-direction.md) owns geography, assets and environment; [camera and motion](specs/05-camera-and-motion.md) owns shots and navigation; [visual acceptance](docs/visual-acceptance-checklist.md) owns evidence. Existing [audit](specs/01-existing-system-audit.md), [inventory](docs/current-feature-inventory.md) and [data contracts](docs/data-contracts.md) constrain preservation. Existing IDs retain their meanings. New `DS-*`, `WA-*`, `CM-*` and `VA-*` IDs supplement them.

**DS-01 — A coastal place to read the day.** Environmental art supplies depth and identity; editorial HTML supplies trustworthy information. Clock/date → concise weather → news → markets → context remains the scan order in every mode (PV-01–PV-06, OV-02). The island is a fictional visual setting for the selected location's conditions, not a geographic reconstruction or a weather instrument. An unobtrusive “Illustrated conditions” descriptor is always available beside environmental status.

Experience mode governs the world; Operate/Read governs controls and information. The signature is a horizontal glass observatory above a branching pale path, balanced by a single slender lighthouse. Pale stone repeats in the architecture and warm-white interface; dark bronze repeats in window mullions and typography. The ocean gives breathing room without emptying the product of information.

Reject voxel/Minecraft blocks, default primitive buildings, mismatched marketplace kits, oversized fantasy towers, neon outlines, floating numeric mesh labels, gauges with invented precision, holographic cards, dashboard tile grids, glass inside glass, price tickers, rotating carousels and cinematic movement on startup. No ornament that reads as an official warning. No stock market sparklines without historical data. No decorative prayer symbols or audio.

## Typography

**DS-02 — Two voices, fixed hierarchy.** Suggest IBM Plex Sans for clock, controls, body and data; Newsreader for featured news and station titles only. Both have official open-license repositories: [IBM Plex](https://github.com/IBM/plex/) and [Newsreader](https://github.com/productiontype/Newsreader). Confirm exact font binaries/license files and numeral behavior before bundling. Self-host reviewed WOFF2 subsets; no remote font request. No font package installed by this specification. Fall back to system-ui for sans and Georgia for serif. Reserve dimensions to avoid a font-load layout jump; test fallback metrics. Do not use a third numeric or monospace family.

| Role | Compact desktop / spacious desktop | Weight / leading | Rules |
| --- | --- | --- | --- |
| Clock hours/minutes | 80 / 104 px | Sans 400 / 1.0 | Tabular lining figures; fixed digit slots; -0.03em tracking; largest text in every screen |
| Clock seconds/period | 24 / 28 px | Sans 400 / 1.2 | Baseline aligned; seconds persist, no live announcements |
| Date | 18 / 20 px | Sans 500 / 1.3 | Selected timezone; full date reachable if compact form used |
| Temperature | 32 / 40 px | Sans 400 / 1.1 | Unit always attached; never larger than clock |
| Station title / featured headline | 24 / 28 px | Serif 450 / 1.15 | News ≤2 visible lines in summary; full title accessible and in detail |
| Body / secondary headline / controls | 16 px | Sans 400–600 / 1.35–1.5 | Left aligned; body measure 45–65ch in detail |
| Source, status, compact labels | 14 px | Sans 400–500 / 1.3 | No meaningful text below 14 px; sentence case, no tracked uppercase |

At 320–767 CSS px: clock 64 px (56 at 320), temperature 32, titles 24, body 16, metadata 14. Keep all numbers aligned by decimal or right edge in tables. Plus/minus and units remain visible; no rolling digits, numeric tweening or animated countdown wheels. Comfortable/Compact changes gaps and optional description presence, not the required summary, font floor or access to all selected companies/stories (FR-13).

## Day and night tokens

**DS-03 — A quiet reading plane.** These are interface colors, independent of the world's physically lit surfaces. Day uses a limestone reading plane; night uses deep blue charcoal. Use day for morning/day/golden-hour, night for twilight/night, with the time-state rules in WA-05. Do not invert every component independently. World color grading never applies to HTML.

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| `ui.canvas` | `#E8EEEB` | `#101E26` | Still/DOM fallback ground |
| `ui.surface` | `#F2F1EA` | `#17272F` | Opaque text backing, drawer |
| `ui.raised` | `#FFFFFF` | `#223740` | Menus, selected control fill |
| `text.primary` | `#203239` | `#F2F1EA` | All essential readings |
| `text.secondary` | `#52636A` | `#B7C7CB` | Source, age, subordinate labels |
| `action` | `#1C6570` | `#8ED2D6` | Links, selection and focus; never a data freshness claim |
| `positive` | `#276340` | `#A4D3AF` | Positive financial change with + sign |
| `negative` | `#A13535` | `#FFB3A7` | Negative change/error with text |
| `caution` | `#79510D` | `#F1CD83` | Stale/partial/ordinary alert text |
| `critical.surface` | `#632A27` | `#632A27` | Official Severe/Extreme alert backing |
| `critical.text` | `#FFF4EE` | `#FFF4EE` | Official headline and controls |
| `separator` | `#CBD3D0` | `#42565D` | Optional table dividers; not essential boundaries |

Normal text ≥4.5:1; large text ≥3:1; essential icon/control/focus boundaries ≥3:1. These are proposed token pairs, not proof of composited contrast. VA-03 requires rendered sampling over maximum-brightness foam, snow, sunset and night, including both glass slider extremes. Never put small text directly over moving ocean or a sun disc.

**DS-04 — Surfaces and materials.** The rail and bottom ledger are two continuous reading surfaces, not groups of floating cards. One detail sheet is the third possible dominant glass surface. Use a 4 px corner on controls, 8 px on sheets/drawers, no round status pills. Separate content with space and optional table rules; no shadows on resting rows. A dialog may have a soft contact shadow. The opacity setting remains 0.50–0.85 in 0.05 steps, affecting outer panel translucency only. Place an opaque `ui.surface` backing behind all text/control clusters, including focus outlines; the translucent perimeter can reveal scenery. This makes slider extremes meaningful without gambling contrast on blur. If backdrop effects are unavailable, retain the same opaque reading areas. In a modal state, suppress the underlying detail surface visually beneath the scrim so no more than three dominant surfaces compete.

World glass is blue-gray, restrained and somewhat reflective; cedar is gray-brown with warm cut edges; limestone has broad pale strata and softened bevels; bronze is matte brown-black with limited polished highlights. Do not make UI imitate wet glass, stone noise or woodgrain. Material values and geometry quality belong to WA-03/WA-07.

## Layout and component anatomy

**DS-05 — One reading rail, one bottom ledger, one world window.** Baseline desktop requires width ≥1280 and height ≥720 at normal zoom, subject to actual content fit. Use a centered interface frame no wider than 1920 px, 24 px outer margins (32 px at ≥1920). The world fills the viewport and extends beyond the frame on ultrawide. Do not enlarge typography proportional to an ultrawide viewport.

At **1366×768**, exact nominal boxes in CSS pixels are:

| Region | x, y, width, height | Contents |
| --- | --- | --- |
| Reading rail | 24, 24, 344, 552 | Clock/date/location 128h; gap 16; weather 104h; gap 24; news 240h; remaining 40h reserve |
| World safe window | 392, 88, 950, 488 | All four landmarks in Overview; no UI text rendered into world |
| Utility row | 392, 24, 950, 48 | Product name; Overview/Journey/Ambient; Preferences, Refresh, connection status |
| Bottom ledger | 24, 600, 1318, 144 | Markets in left 50%, context in right 50%; internal 16px gutters |
| Detail sheet, when open | 958, 88, 384, 488 | Station heading/close, scrollable details, source/state, Visit in Journey where relevant |

These boxes reserve space; text is never clipped to force them. At larger desktops the rail is 368 px, detail sheet 400–440 px, margins 32, and the ledger remains 144–160 px. At 1440×900 use the same 24 px margins and 344 px rail with additional vertical breathing room. At 1920×1080 use 32 px margins/368 px rail. At 3440×1440 center the 1920 px interface frame; compose the island inside its world window and extend ocean to both edges. The primary island must not drift to the far edge of the monitor.

Nominal Overview/Ambient leaves ≥55% of the frame unoccupied by reading surfaces; station detail may reduce that to ≥30%. Ratios are composition targets subordinate to OV-02 readability, not permission to remove information. Opening details in Overview leaves the camera unchanged even if some landscape is covered; all four silhouettes must remain identifiable in the remaining lane. In Journey, authored focused poses frame the destination in that lane. Use the camera's safe-area projection, not resized models, to achieve this.

**Rail anatomy:** clock → date/location → concise weather with qualifier → topics → featured headline and publisher/age → two secondary headline links each with publisher/age. Weather includes condition, feels-like, high/low and deterministic insight. No photo in the 1366/1440 rail; larger screens may show a small news image only if all summary readings still fit. A headline may use two visible lines with ellipsis; accessible link name and detail preserve full text. No marquee. Selected topics use underline + weight + accessible selected state, not only color.

**Ledger anatomy:** left half contains four unboxed aligned columns: SPY, DIA, QQQ and first selected company in saved order. Each proxy has its visible ETF/proxy name, USD price, signed absolute/percentage change or unavailable, and row-specific qualifier. Heading includes shared snapshot/source age plus “All companies” access. Right half has AQI/category, UV/risk and sunset on row one; currency reference/pair/date and enabled next prayer/time/countdown/Hijri on row two. Show “Weather status applies to UV and sunset” through an accessible shared qualifier. Context grouping is typographic, never another set of cards. Market off gives context the full ledger width; currency/prayer off leaves no dummy values. All selected companies remain in local detail.

**DS-06 — Details and controls.** A station detail sheet contains a heading and Close in a sticky top row, optional tab/disclosure row, normally scrolling content and an accessible source/status footer. It is a nonmodal region on desktop; no focus trap. Do not pin a footer over content. The sheet opens from any mode without forcing travel; Ambient Controls reveals this access. Overview provides the separate “Visit in Journey” action. Preferences is a 440 px modal drawer, full-width below 600 px, with the existing five tabs and nested provider dialog. Keep current consent, search, reset/clear and error behavior. No new settings or persisted quality preference are specified.

Primary controls have ≥44×44 px targets; inline data links ≥24×24 with adequate spacing. One-stroke icon family, 20 px nominal, supplements visible words; familiar Close/Refresh may use icons with accessible labels. Hover: tonal fill and underline for links; press: stronger fill without bounce; selected: fill/underline plus selected semantics; disabled: legible label and adjacent reason, no actionable-looking hover. Keyboard focus: 2 px `action` ring, 2 px offset, on protected backing. Focus is never cut by scroll or surface clipping. A paired landmark highlight is a restrained static perimeter/label, not a glow or animated scale.

**DS-07 — Alerts and space pressure.** The highest undismissed official alert occupies a reserved strip above the world window, below utilities, never over clock/news/ledger or modal controls. Normal alert uses caution text + event label; Severe/Extreme uses critical tokens and official severity words. A 72–96 px strip reduces world/detail height, not summary readings. Permit a two-line official headline with full text in the dialog. Extraordinary content/zoom overflow switches to reflow; no concealed critical information. Read IN-07 for cancellation and announcements; visual storms never create a banner.

## Responsive compositions

**DS-08 — Recompose before shrinking.** At <1280 px width, <720 px height, 200% zoom or any content-fit failure, use document reflow and direct station controls; do not clamp essential content to viewport height. At 768–1279 px the clock/weather header spans the width; a 240–320 px tall still island sits below; news and markets form two readable columns where each is ≥320 px, followed by context. Detail sections open inline under the station navigation; no scroll-driven camera. At 320–767 px use one column with 16 px margins: clock/date/location, weather/alert, mode/station controls, optional still island (160–220 px), news, markets, context, selected detail. At 320 px the image may be omitted with “Island shown as text sections”; all controls/data remain. Table rows wrap to label/value groups, with no two-dimensional page scroll.

Mobile is the same identity with semantic navigation, not a tiny 3D scene underneath stacked floating cards. Journey's Previous/Next/direct controls still select chapters; on narrow screens they reveal the matching inline heading without simulated camera travel. Ambient retains all summary sections and visible exit. Do not auto-scroll on resize or lose focus when transitioning layouts. At 200% zoom the full page may scroll vertically. Long place names, timestamps, translations and URLs wrap; use no smaller type as an overflow remedy (IN-09).

## Data visualization and status language

**DS-09 — Encode only supplied information.** Use tables/rows for market snapshots and currency, a six-hour row list expandable to eight for forecast, and a six-row prayer schedule. Forecast temperature may have a compact line only if every point is a supplied hour and exact values remain adjacent; no smoothed inferred weather, unprovided history or interpolated price. Default proposal is numeric forecast rows, not an additional chart. Precipitation threshold behavior remains FR-04. AQI retains the domain's US AQI category and guidance; pair any category color with name/value and never reinterpret it as local visibility. Positive market change is not automatically “good”; use signed change language, not performance advice. Reference currency date is not quote time. No world building displays actual numbers as mesh text.

**DS-10 — States occupy the same reading position (FS-01, DI-02–DI-07).**

| State | Appearance and example wording | World treatment |
| --- | --- | --- |
| Loading without value | Static muted placeholder at reserved dimensions + “Loading weather”; no numeric filler or shimmer | Neutral time-lit world while weather is unknown |
| Refreshing valid data | Keep value/age; small “Checking…” text; disable only duplicate check | No camera/scene reset |
| Valid/available | Value, units and appropriate source timing; no blanket Live badge | Broad supported illustration only |
| Cached | “Cached · fetched [known age]”; retain source age separately | “Last-known illustrated conditions” |
| Delayed | “Scheduled snapshot · [generation age]” or “Observation time unknown · fetched [age]” | Never imply instant sensor transmission |
| End-of-day/reference | “Reference · [date]”, even after a new fetch | Neutral pavilion architecture |
| Stale | Caution text “Stale · [known age]”; value remains legible | Qualified retained state only within domain validity |
| Partial | “Some data unavailable” plus qualifiers on each affected row/category | Successful siblings remain; no global success pulse |
| Empty | “No stories in this topic” / confirmed “No active alerts” only after valid check | Station remains; no false new-item signal |
| Error/unavailable | Em dash + “Weather unavailable”; concise reason and existing retry/settings action | Neutral weather, still recognizable architecture |
| Disabled/unsupported | Explain in local detail/settings; omit disabled summary slot | Architecture remains without service signal |
| Context changing | Matching cache or “Loading for [location/pair]”; never new labels on old numbers | Immediately neutralize invalid old-context signals |
| Demo | Persistent “Demo” on simulated domains and world; DEV only | Never production fallback |

Keep full provenance available with keyboard/tap in the same mode. Known source time, successful-fetch time and last check are separate labels. Unknown time stays unknown. Rechecking unchanged data never brightens a “live” lamp. Retained prayer is explicitly calculated/cached even when Hijri is hidden. Error copy never says all clear when alerts could not be checked.

## Motion, accessibility and low-power treatment

**DS-11 — Still reading, purposeful travel.** UI entry 180 ms ease-out `cubic-bezier(0.2,0.8,0.2,1)`, at most 8 px translation; exit 120 ms ease-in, at most 4 px. Content/controls become usable immediately; do not stagger individual data values. Hover/fill feedback 100 ms; focus ring immediate. Summary stays in place when panels/chapter data change. Camera/atmosphere durations and interruption priorities are CM-03–CM-07. No auto fly-in, orbit, bob, depth-of-field blur on text, lens flare, shake, lightning flash or automatic camera tour.

**DS-12 — Accessible HTML is the product.** Provide semantic landmarks, headings, buttons, links and time labels; decorative canvas is hidden from assistive technology. Every world interaction has a labeled HTML control. Follow IN-03/IN-06 focus order and nested Escape rules; do not live-announce seconds, prices on every check or environmental frames. New critical alerts announce once without focus theft. No status, positive/negative value, selected topic, alert or station is conveyed only by hue, sound, motion or hover. Keep browser zoom and native input keys. Validate keyboard, screen reader, touch, forced-colors and text expansion in VA-03/VA-04.

**DS-13 — Reduced motion and low power are complete compositions.** OS OR app reduction, or Static, means instant station changes, no animated fades/parallax/precipitation/water/vegetation or continuous decorative loop. Keep a still pose, static cloud/shore shapes and full HTML. Subtle retains travel but halves environmental amplitudes and uses slower sparse loops. Low quality simplifies world detail under WA-07 without hiding data or landmarks. A render-on-demand still world or locally authored still illustration is the lowest tier; it is not an unfinished placeholder. No new battery API or saved quality setting is assumed. Hidden tabs stop decoration within one second; reappearance shows current still state, not replay. Renderer failure produces a concise explanation and Retry world while HTML remains usable (IN-10/PF-05/PF-06).

## Six compositions and review decisions

The exact six screen contracts and shot geometry are [CM-01/CM-02](specs/05-camera-and-motion.md). All inherit DS-05's rail/ledger. Overview and Ambient have a wide island; four focused chapters use the same detail-sheet placement to keep reading positions stable. The weather chapter must not replace the clock with a giant temperature.

Guidance used: project Impeccable for surface hierarchy, state completeness and Operate/Experience separation; Taste's app-screen guidance for numbers as typography and meaningful restraint; Agent Skills specification/frontend guidance for measurable acceptance and HTML access; Design Review for the actual concept-image critique. [Oura reference](docs/references/awesome-design-md/design-md/oura/DESIGN.md) informed editorial serif/sans contrast; [Mercury reference](docs/references/awesome-design-md/design-md/mercury/DESIGN.md) informed paired day/night reading planes. No proprietary fonts, palettes, pill systems or card layouts were copied. The user-pinned island and specification-only scope override generic skill direction lotteries, PRODUCT.md duplication, build phases and app implementation steps. No hooks/telemetry/configuration changed.

Open decisions: reconcile upstream approval record; approve this visual draft; confirm final font files and fallback metrics; appoint asset creator/license owner; confirm reference hardware/browser floor and PF budgets; select renderer/resource strategy separately; resolve data-integrity prerequisites IG-01–IG-04 before scene dependence. This package proposes art and camera design for DEC-12 but does not claim asset procurement, technical architecture or production feasibility is resolved. Evidence and review findings live in [the checklist](docs/visual-acceptance-checklist.md).

2026-11-02 — v0.1 authored. Atlantic coast confirmed by user. Detailed visual specification approval: **pending**. Implementation: **not performed**.
