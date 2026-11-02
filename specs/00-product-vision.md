# Ambient Brief 2.0 — Living World product vision

Status: **draft**, version **0.1**, 2026-11-02. Owner/reviewer: product owner (user); approval pending. The user requested this specification set, not implementation. No rendering stack, technical architecture, final visual specification, dependency, provider change, or implementation plan is selected here.

## Document contract and evidence

This is the master product specification. Read it with:

| Document | Owns |
| --- | --- |
| [02 — Functional requirements](02-functional-requirements.md) | Modes, hierarchy, feature preservation and F01–F16 presentation traceability |
| [06 — Data and interactions](06-data-and-interactions.md) | Context, provenance, integrity prerequisites, navigation, input and failure contracts |
| [08 — Acceptance criteria](08-acceptance-criteria.md) | Requirement verification, proposed budgets, launch gates and review summary |

The four files are one review package, organized by concern. They are not approved module specifications or an implementation sequence. The capability map below is a draft for review in this package; the user's explicit request for all four documents takes precedence over the skill's usual separate capability-map review turn. Later architecture and module specifications must use the reviewed boundaries.

Evidence labels apply throughout:

- **E — Existing verified behavior:** verified in source, as recorded in [F01–F16](../docs/current-feature-inventory.md) and [data contracts](../docs/data-contracts.md). This does not imply browser or live-provider verification.
- **V — Approved product direction:** the island, four landmarks, guided exploration, three modes, weather-reactive cinematic presentation and desktop-first use specified by the user and [AGENTS.md](../AGENTS.md).
- **N — Proposed new requirement:** a new interaction, safeguard, measurable target, or explicit correction of an audited weakness. Draft until reviewed, including every numeric product/performance target in this package.
- **U — Unresolved decision:** a named question requiring later evidence or approval. No implicit selection is made.

“Must” defines a draft acceptance obligation; it does not change this package's approval status. Preserve capability rather than defects. Where E and N differ, the difference is explicit. Stable IDs must not be reused for a different requirement. Audit IDs F01–F16 and R01–R13 retain their meanings in [01 — Existing-system audit](01-existing-system-audit.md).

Research baseline: application revision `0f91c2fedde89f7d495a4c7a7d0d8c2941a56876` and the existing working-tree guidance/tooling/audit documents. Read AGENTS.md, workflow, skill routing, agent tooling, README, audit, inventory and data contracts. Source checks resolved ambiguity in settings defaults/migration and controls; controller/refresh coordinator; NWS and market hooks; currency provider/store; prayer store/calculation/presentation; hourly forecast; atmospheric calculations; and active versus compatibility cache policies. Relevant source links are in the companion requirements. This specification does not assert current endpoint compatibility, CORS, secret availability or measured 3D feasibility.

## Objective and user needs

**PV-01 — Useful at a glance (P0, E+V).** A person working at a laptop or ultrawide monitor must read local time/date, concise weather, news and enabled market/context information without travelling around the world. A brief glance must answer “what time is it here, what is the weather, and what has changed?” Detailed exploration is optional.

**PV-02 — One inhabited information world (P1, V).** Present one coherent, detailed, stylized cinematic island. An observatory owns weather, forecast, AQI, UV and alerts; a lighthouse owns time, optional prayer and Hijri; a signal station owns news and topics; a pavilion owns market snapshots, companies and currency. Landmarks must be spatially recognizable parts of one place, not four isolated scenes or a dashboard placed over an unrelated moving background. Scene composition, lighting and environmental activity must support their information roles.

**PV-03 — Calm sustained use (P0/P1, V+N).** The experience must remain useful for an eight-hour work session, with stable reading positions, controlled animation, truthful ages, manual refresh, failure continuity and no automatic camera tour. Rich atmosphere may never override accessibility, integrity or performance gates.

**PV-04 — Equivalent access (P0, E+N).** Semantic HTML must expose all essential values, source/freshness and controls in every mode and fallback. A canvas click, hover, scroll gesture, color or animation must never be the sole way to obtain information or operate a feature.

**PV-05 — Preserve the product boundary (P0, E).** Preserve the 16 functional areas, existing integrations, normalized domain logic, settings migration, static hosting, security and producer ownership. R01–R04 are explicit integration prerequisites, not permission to silently rewrite providers. [AGENTS.md](../AGENTS.md) and [development workflow](../docs/development-workflow.md) remain the engineering authority.

## Experience and information hierarchy

The clock/date is the primary reading anchor; concise local weather is second; news is third; markets fourth; AQI/UV/daylight/currency and enabled prayer form context. Alerts can temporarily take precedence for attention while the clock remains readable. Detailed weather must not become larger or more dominant than time/date. Prayer remains off by default; only next prayer receives continuous emphasis, with the full schedule expandable.

**PV-06 — Composed presentation (P1, V+N).** Use sophisticated readable HTML overlays integrated with the island's composition. Avoid a dashboard card grid, nested cards, neon borders, excessive pills/chrome and gratuitous glass. At most three dominant glass surfaces may be visible at once. Exact layout, typography, materials, palette, camera coordinates and asset design belong in a later reviewed root DESIGN.md. Source-only review cannot prove this requirement.

| Mode | User purpose | Required composition | Essential information |
| --- | --- | --- | --- |
| Overview | Daily default | Stable composed three-quarter aerial island, all four landmarks recognizable | Persistent summary defined in OV-02; local disclosures without Journey |
| Journey | Deliberate exploration | Guided chapters and direct landmark visits | Same summary remains available; selected station supplies details |
| Ambient | Quiet work companion | Stable wide composition, receding secondary controls, bounded atmospheric activity | Same summary remains readable; never a blank or clock-only screensaver |

## Draft capability map

These are product responsibilities, not source modules, APIs or renderer choices. Arrows below mean “needs the contract/evidence from.” No cyclic dependencies are required.

| Capability ID | Responsibility | Depends on | Requirement destinations |
| --- | --- | --- | --- |
| `data-integrity` | Correct identity, source, freshness, cancellation, alert lifecycle | Existing audited providers/producers | DI-01–DI-10, IG-01–IG-04 |
| `information-access` | F01–F16 semantic summaries, details, preferences and recovery | `data-integrity` | FR-01–FR-16, FS-01 |
| `world-presentation` | Cohesive island, environmental meaning, fallback and resource limits | `data-integrity`, `information-access` | PV-02/PV-06, EN-01–EN-04, PF-01–PF-06 |
| `mode-navigation` | Overview/Journey/Ambient, station selection, camera and input rules | `information-access`, `world-presentation` | OV-01–OV-04, JY-01–JY-04, AM-01–AM-04, IN-01–IN-10 |

Dependency order for later specification review: integrity contracts → accessible information → bounded world presentation → cinematic navigation. This is not a task list or implementation plan. Product mode/state contracts are specified together to avoid conflicting independently designed modes.

## Scope and priority

**PV-07 — Launch scope (N).** Living World launch requires all P0 and P1 requirements in this package. P0 is the functional, integrity and accessible baseline; a P0-only delivery may be an internal milestone but must not be represented as the completed Living World experience. P2 is optional and cannot block or weaken P0/P1. Priority is not a deletion instruction for existing features.

| Priority | Required scope | Launch disposition |
| --- | --- | --- |
| P0 | All working F01–F16 capabilities in their appropriate production/development environments; R01–R04 corrections; honest cache/context/privacy behavior; HTML fallback; keyboard/touch access; basic station/mode navigation and instant-motion alternative; critical alerts; checks and acceptance evidence | Mandatory |
| P1 | Cohesive four-landmark 3D island; composed Overview/Ambient; guided camera chapters with scroll and direct controls; stylized time/weather response; accessible overlays; measured sustainable rendering and assets | Mandatory |
| P2 | Additional shoreline/foliage detail, secondary environmental loops, more refined lighting/weather blends and nonessential selection flourishes within the same resource and motion limits | Future optional polish; new requirements if adopted |

**PV-08 — Exclusions (E+N).** This scope does not add login, account sync, backend, service worker/offline installation, trading/portfolio tools, arbitrary ticker search, market charts, news article reader, AI-generated weather narrative, currency converter, prayer notifications/audio/Qibla/Ramadan tools, free-roam controls, automatic tours, full-screen takeover, or global-device location tracking. No new provider, rendering dependency or publishing change is approved. “Weather-reactive” does not promise a physical forecast simulation, live radar, exact rain intensity or astronomical accuracy absent supporting data.

## Decisions, assumptions and unresolved choices

| ID | Classification | Decision or assumption | Consequence / review destination |
| --- | --- | --- | --- |
| DEC-01 | V | One island, four landmarks, Overview/Journey/Ambient, desktop-first | Fixed product direction; exact art still requires DESIGN.md |
| DEC-02 | N | Persistent HTML summary across modes; overlays open without camera travel | FR/OV/IN criteria; no essential-information gate |
| DEC-03 | N | Start/reload in Overview; mode, chapter, camera and disclosure state remain session-local and do not change browser history | IN-01/IN-08; no new persisted settings implied |
| DEC-04 | N | Ambient entered/exited manually; no idle timeout or automatic touring | AM-01; quietness remains user-controlled |
| DEC-05 | N | Reduced motion or Static disables continuous decoration and animated camera paths; still permits instant station navigation | IN-04/IN-09; more protective than existing CSS-only behavior |
| DEC-06 | N | Critical alert means NWS Severe or Extreme; escalate in HTML, pause camera, never steal focus/open a modal | IN-07; no invented alert detection |
| DEC-07 | N | Clear cached data includes prayer backups and mounted cached values, excludes settings and alert dismissals; reset defaults changes settings only | DI-09; explicit correction to R09, review this semantics change |
| DEC-08 | N | Comfortable/Compact affects loaded spacing and optional descriptions without removing required readings; glass slider retains opacity meaning | FR-13; density completion is new behavior |
| DEC-09 | U | Rendering stack, browser version floor, quality implementation, resource recovery and exact metadata-extension approach | Must be resolved in later reviewed technical work; no stack choice here |
| DEC-10 | N+U | Proposed budgets and named reference devices in 08; availability of test devices/browser versions not confirmed | Agree or revise before substantial 3D work; measure before claiming success |
| DEC-11 | U | Provider plans/licenses, attribution, supported Frankfurter v1 pair/parameters, deployed-origin CORS and current producer health | Verify before launch; unavailable states remain valid, but do not claim unsupported default pair works |
| DEC-12 | U | Asset creators, local asset inventory/licenses and final art/camera design | Resolve before asset acquisition or final visual approval |

Assumptions: the existing default location, units, topics, six companies, currency enabled/default USD/BDT and prayer off remain unchanged. Currency's default is a saved preference, not verified provider support. The clock reflects device time in the chosen timezone; no network-synchronized accuracy guarantee is added. Desktop test sizes include 3440×1440 as the proposed ultrawide reference; small-screen access is a fallback adaptation, not a second mobile art direction.

## Boundaries and review history

Always preserve verified functionality and existing data/security/deployment ownership; follow [engineering boundaries](../AGENTS.md). Ask before changing approved architecture, dependencies, providers, secret/deployment management or discarding work. Never embed secrets, fabricate production readings, weaken validation/checks, or claim unexecuted evidence. No application code or code-style change is part of this documentation task; existing strict TypeScript conventions remain authoritative.

2026-11-02: authored v0.1 at the user's request with the installed spec-driven-development skill and dependency-planning guidance, adapted to repository document authority. Approval: **none recorded**. Acceptance scenarios are future obligations, not tests executed against a Living World implementation. Material decisions, assumptions and open gates are summarized at the end of [08](08-acceptance-criteria.md#review-summary).
