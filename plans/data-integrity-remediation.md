# High-priority data-integrity remediation

Status: implementation verified; milestone only. Owner approval: product owner's chat request on2026-11-02. Scope: source-traced R01–R04 and R09 where needed for context/cache correctness. Sources: [architecture](../specs/03-technical-architecture.md), [functional requirements](../specs/02-functional-requirements.md), [DI/IG contracts](../specs/06-data-and-interactions.md), [roadmap](implementation-roadmap.md), [audit risk register](../specs/01-existing-system-audit.md#5-ranked-risks).

No renderer, dependency upgrade, provider replacement, public producer-schema change, presentation migration, secret/deployment change or commit is included. Broader architecture approval gates remain open.

## Slices and acceptance

- Verified: M01 weather/FX context acceptance: exact context inside existing rounded keys; correct unit/pair labels and values accepted together; late completion/error/finalizer ignored; valid same-context last-good retained.
- Verified: M02 prayer context/date retention: exact dated identity, unknown legacy backup rejection, method/school validation, valid today with failed tomorrow, no expired next prayer, independent cache qualifier when Hijri hidden.
- Verified: M03 alert lifecycle: context clearing independent of coordinator enablement, exact expiry/visibility reconciliation, explicit coverage/check states, dismissal distinct from provider all-clear, original official components preserved.
- Verified: Scoped M04 provenance: accepted metadata plus readonly incumbent presentation projection, unknown/local/date/instant source times, per-row market state, news generation/partial qualifiers, conservative weather/AQI status. Renderer-neutral data only; no WorldTargets or world host.
- Verified: M05 bounded requests/cancellation: direct15s/shared30s, shared prayer deadline with separately retained day results, abort rejects cache fallback, generation-safe owner writes, restart/settings sweep invalidation, mounted FX TTL.
- Verified: Scoped M06a/R09: domain cache validation, future envelope rejection, exact identity wrappers and bounded retained memory. Full privacy-clear/mounted-state redesign, persistence feedback and M06c world host remain outside this milestone.

## Before / after evidence

| Finding | Before | After / regression evidence |
| --- | --- | --- |
| R01 weather/AQI | Hook state survives changed location/unit | Real React browser harness verifies unit change, A→B→A, late response, matching failed fallback, abort and corrupt cache. New domain/context schemas prevent rounded-key collisions. |
| R01 FX | Old rate remains under new settings labels; old request can win | Currency store/provider tests failed before fixes; now verify pair pending/races, wrong cache, abort, returned base/rate/date, original successful time and elapsed TTL predicate. |
| R01 prayer | Global backup accepts other location/method/school/date | Store tests failed before fixes; now verify all context changes, valid fallback, legacy/corrupt/expired backups, old response, abort and today-success/tomorrow-timeout. Calculation tests reject past Fajr. |
| R02 alerts | Non-US disabling bypasses clearing; expiry only at fetch | Browser tests verify immediate US→non-US, late old-location completion, expiry within1s, visibility reconciliation, none vs failed, dismissal surviving recheck. Invalid-expiration unit regression failed before fix. |
| R03 provenance | Fresh cache/loaded may imply live; source age lost in projection | Presentation tests verify null vs valid-empty, no inferred live, original feed generation/browser times, unknown category age, old partial market rows and advancing source age. Existing article/row metadata remains on values. |
| R04 requests | Body/backoff can hang; abort returns cached success; obsolete sweep advances | Shared API/client/coordinator tests failed before fixes; now cover stalled bodies, large Retry-After, abort+cache, new consumer after abort, StrictMode stop/start, settings supersession, hidden/reconnect behavior. Direct-body deadline matrix covers all direct paths. |
| R09 cache | Envelope-only validation, context-free prayer backups | Cache tests verify exact-context collision rejection, corrupt values, retained original time, retention expiry and future timestamps. Prayer new backups participate in ordinary cache storage; legacy ambiguous records never render. |

Test-first evidence: initial currency12 failing/6passing; prayer9 failing/7passing; initial shared requests/coordinator4 failing/20passing, plus later targeted aborted-entry/settings-sweep/partial-prayer regressions reproduced red. Weather/AQI transition checks were added alongside fixes in the real-browser harness; do not treat them as independently recorded pre-fix failures. A deliberate currency base-guard inversion failed two provider tests; source restored before full validation.

## Verification environment and results

2026-11-02; macOS workspace, Node26.13.0/npm11.20.0, Vite6.4.3, Vitest4.1.10; actual installed versions, no install/update. In-app Chromium browser at local Vite origin. No actual deployment or provider producer command executed.

- Full `npm run test`: PASS,36 files / 215 tests.
- `npm run lint`: PASS,zero warnings.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; production excludes the separately served browser harness.
- Browser harness: `npm run dev` then `/scripts/__tests__/integrity-browser.html`, “Run regression scenarios.” Uses actual mounted React owners and controlled fetch fixtures. Saves/restores browser test storage/preferences. Final run: all 14 scenarios PASS, including retained fallback, A→B→A, abort, late alert completion, visibility expiry and mounted retention cutoff. Official fixture Details activated with Enter, retained official description/instructions, moved focus to Close; Escape closed the dialog and restored focus to Details.
- Live Frankfurter v1: HTTP200 USD/EUR and HTTP404 USD/BDT; both readable from localhost browser origin. Reference date2026-11-02, returned baseUSD. Supported/default pair endpoint behavior is verified independently from mocks; deployed-origin CORS remains unverified.
- Incumbent dashboard rendered at1366×768 with current/failure data, status qualifiers and original controls. DOM viewport1366×768, document1351×771;3px vertical overflow with development chrome observed, no redesign attempted. Additional sizes/keyboard evidence recorded below.

## Limits and deferred work

The complete M04c world target adapter, M06b cache-clear/persistence UX and M06c host are not part of this approved milestone. Existing legacy prayer backup keys may remain stored but are never read. Unknown observation precision/category ages/check history remain unknown; no market real-time guarantee. Full browser-engine/OS-sleep/throttling/deployed-origin provider matrix has not been executed. Visibility restoration is exercised with a dispatched browser event/advanced wall-clock in the harness, plus coordinator fake-clock tests; that is not a physical multi-day OS sleep test. This milestone adds no camera/motion behavior. No claim that the island/design/performance gates are satisfied.


## Changed files and final review

| Group | Focused files |
| --- | --- |
| Context/alerts | Weather/AQI hooks, normalized models and providers; alert model and NWS provider; incumbent status/detail qualifiers in App, ContextBar, WeatherHero and AQI context item |
| Currency/prayer | Currency/prayer stores, Frankfurter provider, Islamic service, prayer calculation/model/context item, currency context item |
| Shared orchestration | Refresh coordinator/controller; API client, remote-data client, cache service; new context-cache/deadline helpers |
| Projection | New `src/app/presentation/buildBriefSnapshot.ts`; pure source-age predicates in news/market models with existing hook exports preserved; market origin and news feed metadata |
| Regression evidence | Store/provider/calculation/shared-client/coordinator tests; new data-integrity/projection/alert-expiry tests; isolated real-browser harness in `scripts/__tests__/integrity-browser.*` |
| Documentation | Data contracts, scoped architecture/functional approval records, roadmap/progress and this report |

Final source/test review addressed dismissal-vs-official-coverage, offline availability, source-age precedence, superseded sweeps, partial prayer timeout and midnight rollover findings. Pure age policies are imported from domain models; the projection has no runtime request/cache/store dependency. Original prayer fetch provenance survives backup reads. Final full suite remains36files/215tests; lint, typecheck and build pass. `git diff --check` passes after whitespace cleanup. Package files, deployment workflows and AGENTS.md are unchanged.

Rendered checks:1366×768 and1920×1080 screenshots inspected;1440×900 screenshot also inspected with document900px high (no overflow).1920×1080 document fits exactly. Ultrawide screenshot capture was attempted, but viewport geometry did not reliably confirm3440×1440 through the browser tool; ultrawide acceptance remains unverified. No new motion was introduced, and a dedicated reduced-motion/engine matrix was not rerun. Browser logs contained expected unsupported USD/BDT warnings; the test harness's edit-time HMR duplicate-root warning was corrected with root disposal and a clean reload.
