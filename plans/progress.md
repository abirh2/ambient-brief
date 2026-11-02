# Living World — progress and evidence

Updated: **2026-11-02**, architecture/roadmap authoring session. Documentation package: **complete, ready for review**. Architecture/design/product approval record: **pending reconciliation**. Production implementation: **not started**. This record reports evidence; implementation task checkboxes remain only in [the roadmap](implementation-roadmap.md).

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
