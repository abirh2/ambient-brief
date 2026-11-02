# Living World — acceptance criteria and review gates

Status: **draft**, version **0.1**, 2026-11-02; approval pending. Scope: [vision](00-product-vision.md), [functional requirements](02-functional-requirements.md), [data/interactions](06-data-and-interactions.md). All implementation checks below are **not run / not yet implemented**. This document specifies evidence needed later; it does not claim Living World exists.

## Acceptance policy

P0 and P1 must pass before a Living World launch. P2 is future optional polish. No failed requirement, reduced threshold or missing device test can be silently marked complete. Record each result as pass/fail/blocked/not run, exact revision, environment, input state, observed result and evidence path. A test/build pass alone proves neither visual quality nor production access. Missing data can legitimately be unavailable; it cannot be falsely advertised as working or live. Approval of this draft is separate from implementation or launch approval.

Use Vitest for normalization, context/state, freshness, expiry, timeout and cancellation logic; controlled browser scenarios for input/focus/rendering; production preview for chunks/assets/subpaths/demo exclusion; deployed-origin checks for external data/CORS. Reuse existing tests; do not weaken checks to meet targets. Fixtures/fake clocks/network failures belong to an explicit development/test harness, never a production fallback. Existing DEV controls are incomplete and cannot prove every scenario.

## Feature acceptance matrix

Run feature interactions in all three modes and semantic fallback, unless a row is explicitly development-only. Shared FS-01 state checks apply wherever the row supports those states. Use keyboard and touch/pointer; record actual focus and displayed context rather than static markup alone.

| Test ID / requirements | Objective pass condition | Method / evidence |
| --- | --- | --- |
| AC-F01 / FR-01, F01 | With device zone different from selected location, clock seconds/date match a controlled instant in the selected IANA zone; 12/24-hour changes reformat clock, forecast, sunset, prayer and timestamps. Clock remains primary and readable during all modes/offline; seconds do not announce. Invalid timezone discloses fallback and offers correction without crash | Fake-clock formatting tests, rendered screenshots and screen-reader/keyboard check |
| AC-F02 / FR-02, F02 | No geolocation permission on startup/mode change. Search <2 chars makes no request; typing ≥2 waits 300 ms, displays ≤8 results, arrows/Enter select pending result, Use confirms and Cancel preserves active location. Denied/timeout/unsupported/empty/search error preserve prior selection. Reverse-name failure keeps coordinates/My Location and country unknown | Request spy, fake timers, browser consent/error overrides, keyboard/touch recording; location privacy text |
| AC-F03 / FR-03, F03 | Temperature/feels-like/high/low/condition and deterministic insight match normalized weather; detail exposes humidity/wind with correct requested units. At AQI 100 versus 101 summary emphasis changes as existing logic dictates. Loading/error/matching cached data and retry/settings remain usable; unit/location change never relabels previous values | Domain fixtures/tests plus browser before/during/after context switch |
| AC-F04 / FR-04, F04 | Forecast shows six of next eight hours initially and all eight on expansion, re-collapses, uses selected timezone/time format and temperature units. Precipitation at 14/15/39/40% tests hidden/display/emphasis thresholds. Expand does not fetch or move camera; malformed aligned series fails validation | Provider/component tests; keyboard/tap forecast expansion in every mode |
| AC-F05 / FR-05, F05 | Highest valid alert matches severity/urgency order. Dialog exposes full official fields, previous/next, close/dismiss with focus containment/return. Dismissed stable ID stays hidden on reload/recheck until its retention rule ends. Supported none, unsupported and unavailable are visibly distinct; cached active alert has age | NWS fixtures, focus/keyboard/tap checks; IG-02 scenarios; no source text fabricated |
| AC-F06 / FR-06, F06 | Time/weather changes affect a coherent island/fallback without camera movement or domain requests. Living/Subtle/Static and OS/app reduced motion produce specified behavior. Unknown/unavailable and cached weather never imply freshly measured clear skies | EN scenario screenshots, frame/request trace, motion-policy checks |
| AC-F07 / FR-07, F07 | All eight topics exist; preferences cannot select zero or >3; active-topic content respects category membership and no unrelated fill. Summary includes featured+≥2 secondary links when available, local expansion exposes further stories. Empty category/feed, partial/old feed, failure and broken/missing image remain distinct. Links/new-tab/referrer guards preserved; browser only reads static feed | Category/ranking/schema tests, request trace, browser topic/customization/expansion, old/partial/broken-image screenshots |
| AC-F08 / FR-08, F08 | SPY/DIA/QQQ are visibly ETF proxies, never index levels; USD price/change maps to source. One to six supported companies selectable and all selected values accessible without Journey. Missing change/price never zero-filled; partial/stale rows identifiable. Check unchanged versus newer snapshot gives correct notice; market disable stops market requests but currency may continue | Snapshot/selection tests, provider-request trace and partial/unchanged/off screenshots |
| AC-F09 / FR-09, F09 | Numeric AQI/category/general guidance and pollutant units/time match source. Null AQI+valid pollutants shows Unknown AQI with real pollutants. Missing pollutants remain unavailable. Detail open/close/outside/Escape and focus return work; cached status remains visible with detail closed; no separate AQI polling added | AQI fixtures, browser popover/focus/touch, source/freshness capture |
| AC-F10 / FR-10, F10 | UV risk/value and sunset match weather in chosen timezone/format; null UV or sunset independently shows unavailable. Weather stale qualifier covers these values. No extra UV/daylight network request or fabricated sunrise control | Formatting/null tests, screenshot and request trace |
| AC-F11 / FR-11, F11 | Enablement and base/quote selector persist, equal pairs cannot be chosen, reference equation/date/source/fetch time accessible by keyboard/tap. New pair never labels old rate; unsupported pair remains unavailable. List fallback supplies names only. Reference value is never called intraday/live | Currency state/identity tests, browser selectors/error/detail, actual compatibility gate AC-O01 |
| AC-F12 / FR-12, F12 | Default is off with no prayer request. Enabling exposes next prayer/countdown, requested Hijri and schedule disclosure only when enabled by preference. Six-row schedule includes sunrise but next prayer excludes it; all five methods/two schools remain selectable. After Isha chooses valid tomorrow Fajr; timezone-date rollover refreshes; missing tomorrow/past schedule produces explicit unavailable instead of a past “now.” Cached badge persists even with Hijri hidden | Fake-clock/calendar/context tests including DST and multi-day sleep; keyboard/touch settings/schedule; partial/failed fixtures |
| AC-F13 / FR-13, F13 | Five preference tabs, automatic device-local saves, legacy/schema-2 restoration/defaults and production demo-off work. Every existing working control remains reachable. Drawer lazy loading/failure is visible/recoverable; nested dialog Escape/focus order works. Opacity range/step remains 0.50–0.85/0.05; density changes loaded spacing/optional descriptions while retaining all required readings. Storage failure displays session-only persistence truthfully | Migration/store tests; browser tab/drawer/provider actions, density/opacity screenshots and storage-denial test |
| AC-F14 / FR-14, F14 | Global refresh visible/disabled while checking; per-domain results distinguish partial/cached/unchanged/failure/skipped. Offline with no usable data does not say cached. Reconnect/visibility checks stale domains; mode/camera/topic-local selection does not duplicate providers. Prior same-context values stay readable with original times | Coordinator tests, network/fake-clock traces and offline/no-cache/partial screenshots |
| AC-F15 / FR-15, F15 | Inject world chunk/model/texture failure and context loss: semantic summaries/settings/refresh still work, concise world error and Retry world appear, no retry loop. Retry failure remains usable; success restores stable selected mode. Whole-app render crash offers production-safe Reload with no dev detail | Controlled runtime failures, keyboard/tap recovery recording, provider request-count comparison |
| AC-F16 / FR-16, F16 | DEV effective tools/diagnostics/reset-to-live remain available with visible demo labels. Unsupported market simulation is not claimed functional. Production restored demo=true is forced off; DevTools/demo UI and simulated readings are absent from production runtime; no secret in diagnostics | Dev/production build comparison, settings tests, bundle/runtime inspection and diagnostic redaction review |

## Mode and interaction acceptance

| Test ID / requirements | Objective pass condition | Method / evidence |
| --- | --- | --- |
| AC-N01 / OV-01–OV-04, PV-01/PV-04 | Cold load/reload starts stable Overview with OV-02 summary and all four landmark identities when world ready; no fly-in/idle movement. At each desktop target, summary fits without page scrolling/clipping. Opening station details, topic/forecast expansion, refresh or hover does not move camera. Visit in Journey is a separate explicit action | Viewport screenshots with all enabled defaults and optional prayer, camera/input/request trace; keyboard route to all details |
| AC-N02 / JY-01–JY-04, IN-01/IN-02/IN-05/IN-08 | Fixed chapter sequence works forward/reverse; direct landmark/HTML visits skip chapters safely; all summary data remains accessible. Latest target cancels prior motion, direct path 0.8–1.6 s and never >2 s; Stop/Escape ≤100 ms. Journey region scroll settles after 200 ms idle within 500 ms. Panel-end scroll does not move camera. Back tracks completed visits, Previous/Next fixed order; Return closes details/resets visit stack without refetch. No URL/history change; browser Back retains normal page behavior | Input/video traces with timestamps, request spy, touch panel/region scroll, browser-history length/URL and focus recording |
| AC-N03 / IN-03/IN-04/IN-06, FS-01, PV-04 | Every canvas action has keyboard/tap HTML equivalent, no trap/hover-only data, focused controls stay visible. Modal/nested modal focus contained/restored; background inert. Camera completion cannot steal modal focus. OS OR app motion reduction/Static gives instant chapter navigation and no continuous loops; activating during travel ≤100 ms stops animation and presents still destination. No clock/frame announcement flood | Full keyboard traversal, VoiceOver+Safari and NVDA+Chrome reading check on named environments; pointer/touch recording; OS/app/Static matrix |
| AC-N04 / FR-05, AM-04, IN-07, IG-02 | New Severe/Extreme official alert during travel/ambient pauses camera, reveals HTML banner/controls, announces once, preserves focus/mode. No flash/audio/modal auto-open. While modal open, controls remain unobscured and focus trapped; alert banner is available on close. Unchanged/dismissed alert does not repeat; expiry/context change clears signal | Fixture alert/severity/dismissal timeline with focus, motion and announcement log |
| AC-N05 / AM-01–AM-04, IN-01/IN-05 | Ambient requires manual entry, closes details, retains entire OV-02 summary. Secondary controls recede after 10 s only if unfocused; Exit/Controls remains visible, focus/movement/tap restores tools. Headline links work first tap. Exit/Escape returns Overview after nested UI closes; ordinary interaction does not exit, no idle auto-entry or touring | Fake-timer plus real browser recording; screenshots before/after receding, keyboard/tap, reduced-motion repeat |
| AC-N06 / FR-15, IN-09/IN-10, PV-04 | No WebGL, failed chunk/assets and context loss retain every enabled summary/feature and HTML chapter navigation. Resize/200% zoom/320 CSS px permit readable document scroll/reflow without two-dimensional page scroll. No lost focus or clipped modal/essential control; retry does not reset providers | Capability/failure injection, responsive screenshots and all-mode keyboard recovery |

## Data integrity and security acceptance

| Test ID / requirements | Objective pass condition | Method / evidence |
| --- | --- | --- |
| AC-I01 / IG-01, DI-02, FR-01–FR-04/FR-10–FR-12 | Slow request A, accept settings context B, resolve/fail A last: no A value/error/loading/timestamp/scene writes in B. Repeat location, units, pair, method/school and disable/re-enable. Wrong-context prayer backup rejected; invalid timezone disclosed; currency response base mismatch/nonpositive/nonfinite rate/invalid date rejected. Unknown prayer method never mislabeled as known requested calculation | Unit/integration fake promises/cache records plus browser pending-switch screenshots; assert all visible labels and values share context |
| AC-I02 / IG-02, DI-02/DI-05/DI-07 | US A→non-US→US B clears A immediately independent of disabled provider; late A request ignored. Alert expiring while visible disappears within one second of its valid end; hidden-tab resume filters before first visible alert paint. Cached unexpired B alert retains age; no cache+failure says unavailable, not none | Fake-clock expiry tests, context/cancel tests and controlled browser hidden/resume trace |
| AC-I03 / IG-03, DI-03–DI-07 | Network-loaded weather with no observedAt is not Live; fresh cache shows cache provenance. Unchanged/partial old news keeps source age with category-refresh unknown. Partial market row retains provider timestamp/stale and null stays unknown. Reference currency date and prayer context/cache are explicit. Cache/failure/cancel does not advance successful-network timestamp; new source and last-check times remain distinct; partial results never “all refreshed” | Table-driven provenance tests for every active state plus HTML/world capture of the same accepted values/status |
| AC-I04 / IG-04, DI-05/DI-06 | Advance mounted currency beyond 12 h: next visible stale scan/check invokes rate work without changing pair. Stall each direct request/body: ≤15 s, no indefinite loading; existing-client invocation ≤30 s including retry/body and seven-provider sweep ≤210 s. Stop/offline/settings/disable cancellation blocks all late writes, including cached market fallback after abort. StrictMode double setup leaves one active coordinator/request owner; hide/resume does not burst duplicate requests | Fake-clock/provider tests and browser request traces; repeat rapid toggles/stop-start and timeout cases |
| AC-D01 / DI-08/DI-09, FR-13, R09 | Corrupt/expired/wrong-context cache never renders as current. Clear caches removes all domain response/backup data and in-memory fallback, retains settings/location/dismissals, and suppresses pending repopulation. Market-only clear affects only markets. Reset restores defaults without claiming erasure; storage-denial remains usable and disclosed | Seeded storage snapshots before/after actions and reload, pending-request race, malformed payload/state tests |
| AC-S01 / DI-01/DI-07, FR-07/FR-08/FR-16, PV-05/PV-08 | Browser network contains no Currents/Finnhub credentialed request or workflow dispatch. No keys/tokens in JS/assets/storage/URLs/public JSON/logs. Static producer validation, atomic partial/total-failure retention, nine symbols, ETF labels and current Actions-only secret ownership remain intact. No unofficial proxy/backend/new dependency or production mock fallback | Source/workflow diff and bundle/network review, existing producer tests; no secret value printed or required for frontend verification |
| AC-S02 / DI-09, FR-02/FR-13, R11 | No automatic Geolocation call; coordinate/provider-transfer and browser storage disclosure accurate; news image URL/referrer safeguards retained. Local scene asset/license ledger and attribution exist before assets ship; no unapproved external texture/tracker call | Browser requests/consent review, source/cache-control checks, asset inventory/license evidence |
| AC-O01 / DI-10, R07/R08/R11/R12 | Actual deployed origin reads validated news/market public documents and supported keyless providers. NWS supported-US result/error represented honestly. Frankfurter requested base/quote/default-pair compatibility is observed or explicitly blocked for reviewed resolution. Record provider entitlement/usage/attribution verification and asset subpath success; unavailable required integration is not a false pass | Timestamped redacted HTTP/schema/CORS evidence and operational owner review; `/ambient-brief/` preview; no workflow dispatch or secret changes as incidental verification |

## Environmental and visual acceptance

**AC-E01 — PV-02/PV-06, EN-01–EN-04 (P1 with P0 motion/integrity safeguards).** Capture day/morning/sunset/night and clear/cloud/rain/snow/fog/storm, unknown weather, stale weather, unknown/high AQI, optional features off/on, news partial and market partial. Compare exact same accepted data between scene and HTML. Pass only if one island/four roles remains recognizable, atmosphere is stylized and honestly qualified, no unknown value becomes active signal, text remains readable, clock/date dominates detailed weather, and there are at most three dominant glass surfaces with no dashboard card-grid concept. A future DESIGN.md must supply reviewable visual references/camera composition; subjective art approval is recorded separately from numeric tests.

For significant UI implementation, require screenshots at 1366×768, 1440×900, 1920×1080 and 3440×1440; include default Overview, Journey station/detail, Ambient controls receded, modal, worst-case long content, critical alert, loading, cached/stale/partial, unavailable and fallback. Full state fixture matrix must be exercised at each size; store representative screenshots plus a result table for each combination. Screenshot source/code inspection does not replace actual rendered review.

Accessibility pass thresholds (N, P0, assessed by AC-N03/AC-N06): normal text contrast ≥4.5:1, large text ≥3:1, essential control/focus boundaries ≥3:1 against adjacent color; targets ≥24×24 CSS px with adequate spacing, primary touch controls ≥44×44; visible focus unobscured; 200% zoom and 320 CSS px reflow as IN-09; no flashes; no essential information available only through color/movement/canvas. Measure against the brightest/darkest supported atmospheric backgrounds and both slider extremes. Automated checks supplement manual keyboard/screen-reader evidence.

## Proposed performance and asset budgets

All PF requirements below are **N draft targets**, not existing measurements or approved renderer choices. Agree on these targets and reference-device access before substantial 3D implementation. If they cannot be met, revise art/quality strategy or propose a reviewed budget change; do not quietly lower the gate. No hardware/browser was tested for this specification.

Reference hardware proposal:

- **Reference A:** MacBook Air (2020), Apple M1 integrated GPU, 8 GB RAM, plugged in, normal power mode; Chrome and Safari. External display/viewport 1920×1080 and 3440×1440 for ultrawide testing.
- **Reference B:** Lenovo ThinkPad X1 Carbon Gen 9, Intel Core i5-1135G7/Iris Xe integrated GPU, 16 GB RAM, Windows 11, plugged in, normal power mode; Chrome and Edge.

Availability of those exact machines is unresolved (DEC-10). Record exact OS/browser stable version, display refresh rate, viewport, device scale factor, battery/power/thermal conditions and build revision in evidence. Browser support floor is still DEC-09 and must be resolved before implementation acceptance; naming a test browser here is not a compatibility assertion. Use actual device traces, not only emulation. CSS viewport sizes are independent of panel's native resolution.

| Requirement / priority / risk | Proposed bound | Measurement / acceptance test |
| --- | --- | --- |
| PF-01 / P0 HTML, R05/R10 | Essential HTML shell LCP ≤2.5 s; controls respond without waiting for renderer; layout shift CLS ≤0.1. Network data may still be loading with truthful placeholders | AC-P01: five cold production-preview runs on each reference device at 1920×1080, 20 Mbit/s down/5 up/100 ms RTT, empty cache; p75 of runs passes. Intercept provider latency/failure in test harness separately from shell loading; save trace/LCP/CLS and visible-content timestamps |
| PF-02 / P1 world, R05/R12 | Eager application JS total ≤200 KiB gzip; optional renderer/world JS total ≤700 KiB gzip; initial world transfer including its assets/chunks ≤8 MiB; all optional world assets/chunks combined ≤16 MiB. First complete Overview island ≤6 s at PF-01 network | AC-P02: build manifest/import graph, gzip and network sizes including transitive chunks, no double counting; five cold runs, p75 world-ready ≤6 s. Verify renderer failure/loading never blocks PF-01. Existing audit sizes are baseline evidence only, not a pass |
| PF-03 / P1 runtime, R05 | ≥30 rendered FPS over representative 60 s settled/travel/weather segments, p95 inter-frame interval ≤40 ms, p99 ≤66 ms; target 60 FPS where possible. HTML click/key-to-visible-feedback p95 ≤200 ms during rendering. Meet bounds at largest target viewport on each device using permitted quality reduction | AC-P03: foreground production traces after 2 min warmup, three runs per day/storm/scroll/direct-visit segment; log FPS/intervals and input latency. Record effective resolution/effects/quality; dropping essential overlays or P1 landmark identity is not allowed |
| PF-04 / P1 resources, R05/R11 | Pixel ratio ≤1.5 and rendered framebuffer ≤5 million pixels; reduce internal resolution if needed. Visible island ≤250,000 rendered triangles, ≤200 draw calls per frame including effects; decoded texture budget ≤96 MiB and tracked world textures/buffers/render targets ≤128 MiB | AC-P04: renderer counters/resource inventory at all chapters/weather extremes, actual drawing-buffer size at DPR 1 and 2 displays. Include mipmaps/effect targets; mark unobservable driver allocation separately, never equate download bytes to GPU memory. Count scene/effect resources and verify disposal after retry/unmount |
| PF-05 / P0 sustained use, R04/R05 | Within 1 s hidden, zero continuing decorative animation callbacks/frames; no routine provider refreshes while hidden. Over 8 visible hours, no lost clock/date/alert/currency rollover correctness or unbounded resource growth; after warmup+all panels/stations visited, retained JS heap growth ≤20 MiB and tracked world resources growth ≤5% under repeated identical visit/retry cycles | AC-P05: eight-hour soak on both references, 10 min hidden interval plus sleep/resume, offline/reconnect, clock-date/prayer/FX TTL boundaries. Capture initial 15-min and final comparable heap snapshots (controlled GC where supported), resources/request/timer counts and periodic traces. Record unsupported memory instrumentation as a gap, not a pass |
| PF-06 / P0 fallback, R05/R06/R10 | Motion-off/static settled world has no continuous decorative loop; hidden tab has none. World failure to usable fallback ≤1 s after detected error, essential HTML never removed; explicit retry creates no duplicate provider ownership or accumulating scene resources | AC-P06: no-WebGL/context-loss/chunk/texture failures with frame/resource/request traces, repeat 20 Retry world and station cycles; keyboard/motion-off equivalent remains complete |

Smooth camera path durations and interruption deadlines are separately enforced by AC-N02/AC-N03; performance cannot be “improved” by ignoring input or deleting essential content. P2 extra effects must fit these same approved bounds. No new dependency or technical allocation strategy is selected by these budgets.

## Cross-document requirement coverage

The following index closes traceability for shared and master requirements beyond the feature rows. Each listed destination is a future evidence obligation.

| Requirement group | Verification destinations |
| --- | --- |
| PV-01–PV-08 | AC-N01/AC-N03/AC-N05/AC-N06, AC-E01, AC-S01, PF/launch gates below |
| FS-01; FR-01–FR-16 | AC-F01–AC-F16 with AC-N03 and all applicable state fixtures |
| OV-01–OV-04 | AC-N01, AC-N04, AC-I03 |
| JY-01–JY-04 | AC-N02/AC-N03/AC-N06 |
| AM-01–AM-04 | AC-N04/AC-N05, AC-P05/AC-P06 |
| DI-01–DI-10 | AC-S01/AC-S02, AC-I01–AC-I04, AC-D01, AC-O01 |
| IG-01–IG-04 | AC-I01–AC-I04 respectively; required before scene data dependence |
| EN-01–EN-04 | AC-E01, AC-F06/AC-F10, AC-N03, AC-S02, AC-P02/AC-P04 |
| IN-01–IN-10 | AC-N01–AC-N06, AC-I02/AC-I04, AC-P05/AC-P06 |
| PF-01–PF-06 | AC-P01–AC-P06 respectively |

| Audit risk | Requirement mitigation / evidence |
| --- | --- |
| R01 context mismatch | DI-02/IG-01; AC-I01 and AC-F02/AC-F03/AC-F11/AC-F12 |
| R02 alerts location/expiry | FR-05/IG-02/IN-07; AC-I02/AC-N04 |
| R03 incomplete provenance | DI-03/DI-04/DI-06/IG-03; AC-I03 |
| R04 refresh/cancel gaps | DI-06/IG-04; AC-I04/AC-P05 |
| R05 GPU/load/thermal | FR-15/IN-10/PF-01–PF-06; AC-P01–AC-P06 |
| R06 accessibility/motion | PV-04/IN-03–IN-06/IN-09/IN-10; AC-N03/AC-N06/AC-E01 |
| R07 pipeline/secrets | PV-05/DI-01/DI-10; AC-S01/AC-O01 |
| R08 provider availability/quotas | DI-05/DI-10; AC-O01, no cadence increase |
| R09 cache trust/retention/clear | DI-05/DI-08/DI-09; AC-D01/AC-I01/AC-I03 |
| R10 verification gaps | All scenario evidence requirements, named runtime environments and unverified register |
| R11 external assets/privacy | DI-09/EN-04; AC-S02/AC-E01/AC-P04 |
| R12 subpaths/portability | DI-01/DI-10/EN-04; AC-O01/AC-P02/AC-F15 |
| R13 documentation/limited controls | FR-13/FR-16 and source-evidence notes; AC-F13/AC-F16; no incidental tooling cleanup |

## Launch gates and later evidence

1. Product owner reviews v0.1, capability map, proposed N decisions/budgets and unresolved U items; record exact approved scope/date/message. This package is not yet approved.
2. Resolve browser/device floor, hardware availability, metadata strategy and provider compatibility; review technical architecture and root DESIGN.md separately before major implementation. Preserve existing stack/provider/deployment ownership meanwhile.
3. Verify IG-01–IG-04 and DI-08/DI-09 corrections with focused evidence before accepting dependent scenery. Integrity corrections must be separately scoped; no silent provider migration.
4. All P0/P1 scenarios pass at agreed targets, including keyboard/touch/reduced motion, critical alerts, complete fallback, 8-hour soak, named-device rendering and deployed-origin/static-publication checks. Review required asset attribution/license inventory.
5. Execute repository checks below and record evidence against actual changed implementation. Update the future implementation record/spec change history; do not rewrite these criteria to fit a failing implementation. P2 remains explicitly deferred unless reviewed into scope.

Commands for later implementation verification (and repeatable baseline checks for this documentation change):

```sh
npm run test
npm run lint
npm run typecheck
npm run build
```

Use `npm run dev` for explicit development-only fixture/manual interaction work and `npm run preview` for built-artifact verification. Do not run feed generation, install packages, dispatch workflows or deploy as routine checks. Test/command evidence belongs with later implementation milestones; this specification task will report its own documentation/check results separately. Relevant source/tests stay in existing `src/features/`, `src/app/`, `src/stores/` and `src/lib/api/`; no new directory/API structure is prescribed here.

## Specification authoring verification — 2026-11-02

This documentation task created only the four requested specification files. Existing guidance/audit/tooling work was preserved; while this task ran it was committed separately as `887cb00` (`added docs and skills`). This task created no commit. Application source, dependencies/lockfile, workflows and Vite configuration are unchanged from the audited application revision. No packages were installed and no feed-generation, provider call, deployment or visual change was performed.

Environment: Node 26.13.0, npm 11.20.0, macOS arm64. Executed against installed dependencies:

| Check | Result |
| --- | --- |
| `npm run test` | PASS — 31 test files, 160 tests; existing Node experimental localStorage warnings |
| `npm run lint` | PASS — zero warnings/errors |
| `npm run typecheck` | PASS |
| `npm run build` | PASS — current application build, no Living World code |
| Documentation validation | PASS — all relative file links resolve, code fences balanced, F01–F16 feature matrix/criteria and R01–R13 risk matrix present; requirement groups indexed; whitespace checked |
| `git diff --check` | PASS for tracked changes; new specification whitespace checked separately |

These results validate the documentation task and preserved application baseline only. No rendered screenshots, keyboard/touch/screen-reader runtime checks, 3D benchmark, soak, provider compatibility/entitlement or deployed-origin CORS check was performed; the Living World criteria above remain not run. Proposed hardware and budgets are not measured results.

## Review summary

Approved direction: one cinematic stylized island with the four stated roles, guided paths and three modes. Existing baseline: F01–F16 and current provider/producer/security boundaries; no new existing functionality is claimed.

Material proposed decisions: persistent cross-mode summary; manual Ambient with 10-second tool recession; session-local modes and no URL/history changes; fixed chapter sequence plus direct visits; cancelable bounded camera movement and panel-owned scroll; modal interruption without auto-resume; OS/app motion reduction and Static mean still atmosphere/instant travel; full HTML fallback; Severe/Extreme official-alert escalation without focus theft; conservative per-value provenance; correct context/expiry/cancellation gates; cache clear includes backups/mounted values but preserves settings/dismissals; honest save feedback and useful loaded-content density. These are N draft requirements, not historical behavior or approval.

Assumptions for review: retain current defaults including currency enabled/USD/BDT and prayer off; no default-pair support guarantee; 3440×1440 ultrawide target; two proposed reference machines; all P0+P1 needed for Living World launch. Numeric camera, alert-expiry, timeout, accessibility, load/render/asset and long-session targets require explicit review and later measurement. P2 environmental polish remains future optional scope.

Unresolved decisions: rendering stack/version and technical architecture; browser version floor and access to reference hardware; exact art/camera design and asset creators/licenses; conservative unknown metadata versus reviewed domain-contract extensions; provider account entitlement/attribution, current Actions/CORS health, Frankfurter v1/default-pair compatibility and any separately approved remedy. No technical architecture, DESIGN.md, implementation plan, dependency install or app behavior change is included. Review of this package is the next lifecycle step.

2026-11-02 — v0.1 authored. Approval: **none recorded**. All Living World implementation evidence: **not run**.
