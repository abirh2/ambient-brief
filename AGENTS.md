# Ambient Brief agent instructions

## Purpose and direction

Ambient Brief is a single-page information display that stays open on laptops and ultrawide monitors. Keep it cinematic, calm, and useful at a glance. Information priority remains clock/date → concise local weather → news → markets → context (AQI, daylight, currency, optional prayer times).

Living World 2.0 will present one coherent, stylized cinematic 3D island: a central weather observatory, a lighthouse for time/prayer, a news signal station, and a market/currency pavilion. Guided camera paths and live weather/time changes support functional Overview, Journey, and Ambient modes. This direction does not select a rendering stack or authorize implementation without a specification. Preserve existing integrations, business logic, security, and deployment behavior.

## Read first

- This file is the repository's engineering entry point; do not duplicate it in other agent rule files.
- [Development workflow](docs/development-workflow.md): lifecycle, document authority, review, progress, and autonomy.
- [Skill routing](docs/skill-routing.md): select only the workflows needed for the task.
- [README](README.md): setup, current providers, static pipelines, and deployment.
- Feature requirements belong in `specs/`; implementation plans and milestone evidence belong in `plans/`.
- Root `DESIGN.md`, once created and approved, is the authoritative visual specification. It does not exist yet. [Existing design system](docs/design-system.md) describes the dashboard baseline; reference templates and historical audits do not authorize redesign work.

## Stack and commands

Use React 19, strict TypeScript, Vite 6, Tailwind CSS 4, Zustand, Zod, and Vitest. npm is authoritative; preserve `package-lock.json`. Node 22+ and npm 10+ are required. No 3D framework is selected yet.

| Purpose | Command |
| --- | --- |
| Reproducible install | `npm ci` |
| Development | `npm run dev` |
| Tests | `npm run test` |
| Lint (zero warnings) | `npm run lint` |
| TypeScript | `npm run typecheck` |
| Production build (also typechecks) | `npm run build` |
| Preview build | `npm run preview` |

Run tests, lint, typecheck, and build after meaningful changes. Feed-generation commands in README require credentials and write data; they are not routine verification commands.

## Engineering and architecture

- Read relevant code, callers, tests, and the spec before editing. State material assumptions and surface tradeoffs or blocking uncertainty.
- Prefer the simplest complete solution, small feature-oriented components, existing utilities, and focused diffs. Avoid speculative abstractions and unrelated cleanup. Preserve behavior outside the approved change.
- Preserve strict TypeScript; no `any`, unsafe casts, or weakened checks to obtain a pass.
- Keep orchestration in `src/app/`, domain logic/providers/hooks in `src/features/`, shared request/cache policy in `src/lib/api/`, and persisted settings in `src/stores/`. Inspect existing compatibility exports before adding another abstraction.
- Normalize provider responses behind replaceable adapters; validate external responses with Zod. Keep provider wire types and requests out of UI/rendering components. Rendering consumes normalized domain state, never owns provider polling.
- Retain cache, refresh, cancellation, timezone, settings-migration, and failure semantics unless the specification explicitly changes them. No backend unless explicitly requested.

## Data and security invariants

- Identify each external value internally as `live`, `delayed`, `end-of-day`, `cached`, `stale`, `unavailable`, or `demo`; preserve per-value provenance through UI and scene state.
- Never advance a successful-refresh timestamp on failure. Retain validated previous data with truthful status, or show unavailable. Never substitute realistic mock data in production; explicit demo tools remain development-only.
- Never expose developer-owned keys in frontend code, Vite variables, storage, URLs, generated public data, or logs. No unofficial CORS proxies.
- Preserve current static Currents news and Finnhub market pipelines with Actions-only secrets. Browser refresh reads published data; it must not call credentialed providers or dispatch workflows.
- Prefer documented, keyless, browser-compatible providers for new integrations: Open-Meteo (weather/geocoding/AQI), NWS (US alerts), Frankfurter (currency), AlAdhan (prayer/Hijri). GDELT requires successful deployed-origin CORS verification before activation. TradingView is an option only if native keyless markets are unavailable and a provider change is approved; neither preference replaces working pipelines.

## Design, accessibility, and performance

- Keep one coherent art direction across scenes, typography, lighting, and semantic colors. Avoid generic admin-dashboard styling, nested cards, neon borders, gratuitous gradients, excessive pills/chrome, and unnecessary glassmorphism. Use no more than three dominant glass surfaces; avoid a dashboard card grid as the visual concept.
- Keep time/date more prominent than detailed weather. Prayer is optional and off by default; emphasize only the next prayer and keep the full schedule expandable.
- Support 1366×768, 1440×900, 1920×1080, and ultrawide screens; avoid page scrolling at normal desktop heights where practical without clipping readable content or controls.
- Keep readable data and essential controls in accessible semantic HTML, including when a 3D scene is present. Require keyboard access, visible focus, readable contrast, and complete loading, empty, error, stale, hover, selected, and disabled states where applicable.
- Honor both reduced-motion preferences and app settings, including camera movement. Specify a usable fallback when motion or 3D is unavailable.
- Set measurable rendering, load, and asset budgets in the feature spec before substantial 3D work; measure on named hardware/browser/viewports. Bound pixel ratio, assets, and effects; reduce or pause decorative rendering when hidden. Do not tie frame updates to data fetching or React-wide rerenders.
- Significant UI changes require rendered screenshots and visual review at supported desktop sizes, keyboard/reduced-motion checks, and representative data/failure states. Source inspection alone is not visual verification.

## Workflow and completion

Use **Research → Specify → Review → Plan → Implement → Verify → Document** for substantial work. Requirements, design decisions, constraints, and measurable acceptance criteria must be written and reviewed before major implementation. See the workflow for approval and change-control rules; small, unambiguous fixes need only scoped acceptance criteria.

Proceed autonomously within approved scope. Ask before fundamentally changing approved architecture, deleting working functionality, introducing major unspecified dependencies, discarding/overwriting existing work, or changing deployment/secret management. Do not commit unless asked.

Done means acceptance criteria have evidence, applicable checks pass, behavior is preserved, required visual/performance/accessibility checks are recorded, and specs/plans/docs reflect the result. Report files changed, commands/results, and remaining risks or unverified conditions. Never claim completion from an unverified assumption.
