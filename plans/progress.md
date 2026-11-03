# Living World — progress and evidence

Updated: **2026-11-02**, isolated Living World observatory prototype. The scoped island slice is **implemented and locally verified**; [implementation, screenshots, performance and remaining gates](living-world-first-slice.md). The earlier R01–R04/R09 integrity milestone remains preserved and verified. Broader Living World migration/release gates remain open. Task registry: [roadmap](implementation-roadmap.md).

The architecture-authoring record below is historical; its “not started” statements describe that earlier session. The integrity and observatory implementation entries at the end supersede them for their approved scopes only.

## Scope and preserved work

Created only the four requested documents:

- [03 — Technical architecture](../specs/03-technical-architecture.md): selected/rejected stack with current peer metadata, nine ownership boundaries, data/module diagrams, accepted-state contracts, camera machine, resource/failure/asset workflow, conflict register, ADR-LW-01 and readiness checklist.
- [07 — Performance and accessibility](../specs/07-performance-and-accessibility.md): inherited PF budgets plus proposed allocations, measured-baseline distinction, Chrome/Firefox/Safari/device matrix, load/frame/idle/memory methods and semantic/motion/keyboard/contrast requirements.
- [Implementation roadmap](implementation-roadmap.md): small independently checked slices, integrity vs presentation tracks, first island vertical slice, F01–F16 and R01–R13 coverage, acceptance/tests/browser/rollback per task.
- This progress record: actual checks, limits and next review step.

No production source, CSS, package manifest/lockfile, workflows, provider/public schemas, generated feed, settings migration, secrets or deployment behavior changed. No renderer/development dependency installed, provider feed generated, workflow dispatched, commit created or site deployed. Build output is ignored local verification output. Existing untracked DESIGN.md, design references/checklist and product/visual specs were preserved.

## Evidence gathered in this session

| Item | Result / source and limits |
| --- | --- |
| Repository baseline | HEAD `887cb004121b975972b81d39bdfb5a2dda7e91a6`, branch `redesign/living-world-v2`; source matches audited application lineage. Source entry/controller/coordinator/models/build configuration rechecked. |
| Required documents | Read AGENTS, workflow/routing, README, all existing numbered specs00/01/02/04/05/06/08, DESIGN.md,16-feature inventory and data contracts; visual evidence checklist consulted. No recorded detailed approval found; do not invent one. |
| Architecture mapping | Existing temporary Graphify AST graph at `/private/tmp/ambient-brief-audit-20261102/graphify-out/graph.json` queried with actual vocabulary `controller refresh coordinator settings weather news markets currency prayer cache`. Query returned499 related nodes/40 displayed at1000-token budget; direct source used to verify owners. Known graph relation-collapse limitation unchanged. No extraction/index/watch created; this query used no semantic model/API tokens. |
| Installed versions | React/DOM19.2.8, TS5.8.3, Vite6.4.3, Tailwind4.3.3, Zustand5.0.14. Node26.13.0/npm11.20.0/macOS arm64. Clean Node22 validation not performed. |
| Current peer/version research | Public npm metadata read2026-11-02: Fiber9.8.2 React/DOM`>=19 <19.4`, Three`>=0.156`; Three/types0.187.0; Drei10.7.9 compatible Fiber9/React19 family; GSAP3.15.0; Motion14.9.0 React18/19. Exact ranges and primary-source links in03. Read-only network access succeeded after sandbox DNS restriction; no packages installed. Peers fit installed React, runtime/type compatibility remains untested. |
| Official technical sources | Fiber introduction/performance/pitfalls, Three WebGLRenderer/GLTFLoader/KTX2Loader, Vite6 assets, Khronos validator, glTF Transform CLI, MDN context-loss extension and W3C WCAG2.2. Links support technical facts in03/07; proposed architecture/budgets are project recommendations. |
| Asset/tool availability | No public GLB/glTF/KTX2/WOFF2 found. Blender/glTF Transform/glTF Validator/toktx/ktx/basisu not on PATH; `/Applications/Blender.app` absent. No DCC/optimizer/encoder assumed available; may exist elsewhere. No assets acquired/optimized/validated in this session. |
| Browser availability inspection | `/Applications/Safari.app` and `Google Chrome.app` present; Firefox.app absent there. Does not prove runnable automation or physical reference-device access. No browser session/visual/performance test executed. |

## Executed preservation checks

These ran against the unchanged application with installed dependencies on2026-11-02. They validate baseline preservation, not Living World.

| Command / check | Result |
| --- | --- |
| `npm ls --depth=0` | PASS, installed baseline package tree recorded |
| `npm run test` | PASS —31 test files,160 tests;1.70 s Vitest duration. Existing Node experimental localStorage warnings; no test failures. |
| `npm run lint` | PASS —zero warnings/errors |
| `npm run typecheck` | PASS |
| `npm run build` | PASS —includes typecheck, Vite6.4.3,1843 transformed modules,1.70 s Vite build |
| Artifact sizes | Main JS431.56 kB/gzip128.83; lazy SettingsDrawer28.37/8.21; CSS100.78/19.00; HTML0.49/0.30. Decimal Vite kB; not transfer/startup/FPS measurements. |
| Document structure/links/coverage | PASS — all four documents' local links/anchors resolve, fences and table columns balanced, no trailing whitespace, F01–F16 and R01–R13 roadmap coverage complete. One table pipe-escaping defect found and corrected during authoring review. |
| Working-tree scope / `git diff --check` | PASS — no tracked-file changes; only the four requested Markdown additions beyond the initial untracked work. New-file whitespace checked directly because untracked files are not covered by `git diff --check`. |

## Implementation status and next step

All M00–M15 code/asset/verification tasks are **not started**. This session completed research, architecture recommendation and roadmap authoring only. Inherited product/visual specifications and new03/07 are drafts; recorded user scope approval is needed before dependent implementation under the repository workflow. Ordinary tasks within an approved slice then proceed without repeated permission requests.

The first implementation review should resolve C01's approval history, C03/C04 minimum-desktop composition, exact browser/device access and provisional targets; approve separately scoped IG/DI corrections and selected renderer versions. The roadmap then orders integrity fixes and an isolated renderer shell before the first data-driven island vertical slice. Full final asset/HTML migration follows that feasibility gate. No request to implement is made or assumed here.

## Unverified and remaining conditions

| Condition | Status / implication |
| --- | --- |
| Exact renderer set compiled/ran with React19/strict TS/Vite6 | **Not run**; metadata compatibility only; M07a must prove before full work |
| C03/C04 safe-lane landmark sizes + dense summary | **Unverified design feasibility**; first minimum-desktop staging must pass or obtain reviewed revision |
| R01–R04 and R09 corrections | **Not implemented**; M01–M06 before dependent data-driven scenery |
| Final assets/fonts/fallbacks/license owner and toolchain | **Unresolved**; no source rights or production GLBs presumed |
| Chrome/Firefox/Safari runtime/keyboard/screen reader/motion/contrast | **Not run**; target matrix and methods specified, no acceptance pass |
| Reference A/B hardware, mobile test devices, actual browser versions | **Not confirmed**; M00/M15 record access or explicit evidence gaps |
| GPU/FPS/resource/CPU/memory/power/thermal and8-hour soak | **Not measured**; PA/PF targets remain provisional, no3D baseline |
| Deployed-origin CORS, current snapshot health, Frankfurter v1 default-pair support and provider entitlement/license | **Not checked**; no silent provider/version/cadence remedy; operational gate remains |
| Final subjective art/composition approval and P0/P1 release acceptance | **Pending**; static fallback alone does not count as the full3D product |

No blocking issue prevents delivery of these architecture documents. The conditions above prevent claiming implementation readiness/launch verification. Do not lower thresholds or erase draft status to close them.

## Architecture decision record and readiness

[ADR-LW-01](../specs/03-technical-architecture.md#architecture-decision-record--adr-lw-01) proposes a lazy persistent Fiber/Three island, authored assets, renderer-neutral accepted-state projection, semantic sibling HTML, one cancelable camera driver and isolated still/DOM recovery. It rejects overlapping helper/animation dependencies initially and preserves current pipelines. Exact dependency choices are proposals pending review; no runtime install was performed.

The authoritative [implementation readiness checklist](../specs/03-technical-architecture.md#implementation-readiness-checklist) distinguishes completed architecture work from unapproved/unverified implementation gates. Review that concrete package next; all implementation checkboxes remain open.


## High-priority integrity implementation — 2026-11-02

Completed the product owner's approved R01–R04 remediation and necessary R09 cache validation with incumbent components. The focused [milestone report](data-integrity-remediation.md) maps before/after behavior and tests to each risk. Contracts and scoped approval records were updated; public provider/producer schemas, dependencies, pipelines, deployment and settings migrations were preserved. No commit or renderer work.

Verification: **36 test files / 215 tests passed**, lint zero warnings, strict typecheck and production build passed. Node26.13.0/npm11.20.0; Vite6.4.3/Vitest4.1.10. Node emits its experimental unavailable-localStorage warning in tests that import stores without a browser; tests use isolated memory storage where required and no checks were suppressed. A currency identity-guard mutation was caught by two provider tests and restored before the full run.

Real Chromium browser harness: **14 scenarios passed** with mounted React owners, including rapid A→B→A, units, valid fallback/original fetch time, aborts, US→non-US, late alerts, ≤1s expiry, none vs failed, dismissals, simulated visibility restoration, AQI identity, corrupt cache and mounted retention cutoff. Official fixture dialog: Enter opens; original description/instructions remain; focus enters Close; Escape closes and returns focus. Incumbent Weather Details keyboard disclosure retains source-local time and timing qualification. Test page saves/restores local test settings/storage.

Live Frankfurter checks, independent of mocks: existing v1 from/to aliases returned HTTP200 with USD/EUR (returned baseUSD, date2026-11-02) and HTTP404 USD/BDT; localhost browser could read both JSON bodies. Existing endpoint/provider/default saved pair retained. Deployed-origin CORS, full engine/device matrix and physical multi-day sleep remain unverified. See milestone report for exact scope and remaining limits.

## Isolated observatory vertical slice — 2026-11-02

Implemented the product owner's explicitly requested first island prototype with the selected exact Fiber/Three versions, an original offline-authored GLB island/observatory, one stable lazy Canvas, guided Overview↔Observatory navigation, semantic controls, OS/app/Static reduction and still/DOM/error recovery. The default dashboard and its providers remain intact. `npm run dev` → `/?world=observatory`; ordinary production builds eliminate the prototype JavaScript. Explicit `VITE_WORLD_PROTOTYPE=true` is only for opt-in local build verification.

Original asset recipe, content hash, rights and size inventory are recorded in [the asset ledger](../docs/world-assets/README.md). Fixed daylight is visibly illustrative; no domain integration, extra station or dashboard migration was implemented. Main changes: `src/main.tsx`, new `src/app/WorldPrototype.tsx`, `src/features/living-world/`, `scripts/world/`, `public/world/v1/`, exact package/lock additions, README and scoped architecture/roadmap evidence. Pre-existing integrity work was preserved; this task made no commit/deployment and changed no pipeline/secret/authentication behavior.

Verification: **38 files / 221 tests pass**, lint zero warnings, strict typecheck and ordinary/opt-in production builds pass. A stale-settlement guard mutation was caught and restored. Actual Chrome 156 browser matrix completed **23 scenarios**, including desktop captures at 1366×768/1440×900/1920×1080/3440×1440, Tab/Enter/Space/Escape/focus, Stop/Continue/retarget, still/OS/saved reduction and Static, hidden-stop, 20 real context-loss/retry cycles, WebGL absent, asset/chunk/image failure, thrown renderer draw, 15-second stalled asset timeout and recovery. Default production still opens the incumbent dashboard/Preferences with zero world resources. `/`, `/ambient-brief/` and `/island-study/` asset paths were exercised.

Preliminary local profile: **M4 Pro / 24 GiB / macOS26.5.2 / Chrome156 ANGLE Metal**, not reference A/B. At ultrawide, **30.30 rendered FPS**, p95 **34.8 ms**, p99 **35.3 ms** in a 15-second sample. Startup peak **62 calls / 106,012 triangles** including shadows; max framebuffer **4,997,376 pixels**. Five production-preview cold runs at 20/5 Mbit/s and100 ms latency: p75 shell **0.623 s**, complete world **2.009 s**, LCP **0.644 s**, CLS0. Final optional JS **265.85 KiB gzip**; model **1.925 MiB**; local still **44.32 KiB**. These fit provisional local budgets, not a full-device/soak certification.

Screenshots and raw results: [artifact directory](../docs/screenshots/living-world-first-slice/), [overview](../docs/screenshots/living-world-first-slice/overview-1440.png), [observatory](../docs/screenshots/living-world-first-slice/observatory-1440.png), [ultrawide](../docs/screenshots/living-world-first-slice/overview-3440.png), [no WebGL](../docs/screenshots/living-world-first-slice/no-webgl.png). The detailed [slice report](living-world-first-slice.md) lists exact commands, ownership, resource estimates and every remaining condition.

Production-quality direction is established in the observatory architecture, coastal composition, lighting and protected editorial HTML. Simplified foliage/materials/glazing, fixed daytime art and font fallbacks remain prototype choices. Full four-station/data-aware presentation, C03/C04 full-dashboard staging, final art-owner approval, A/B and other-browser performance, screen readers/zoom/forced colors, Khronos validator, formal latency, GPU/heap/thermal metrics and long-session gates remain open. No full Living World release acceptance is claimed.
