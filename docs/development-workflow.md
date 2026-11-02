# Development workflow

## Authority and context

Use [AGENTS.md](../AGENTS.md) as the single engineering entry point. This document expands its workflow; [skill routing](skill-routing.md) selects supporting processes. Explicit user instructions and host safety/tool rules take precedence. Skills supply methods, not permission to change product scope or engineering invariants. If approved documents disagree materially, surface the conflict and resolve it before dependent work.

| Document | Responsibility |
| --- | --- |
| [README](../README.md), source, package configuration, workflows | Existing setup, architecture, provider and deployment behavior; verify current facts in code |
| `specs/<feature-id>.md` | Requirements, boundaries, decisions, constraints, measurable acceptance criteria, and approval record |
| `plans/<feature-id>.md` | Implementation sequence, task acceptance, milestone progress, verification evidence, and deviations |
| Root `DESIGN.md` (future) | Authoritative visual specification once created and approved; link from relevant specs |
| [design-system.md](design-system.md) | Current dashboard tokens and components; retain for incumbent UI work until explicitly superseded |
| [agent-tooling.md](agent-tooling.md) and its lock/verification JSON | Installation provenance and known tooling limits; historical setup claims are not current task results |
| `audit.md`, dated visual audit, [GDELT audit](gdelt-news-audit.md) | Historical evidence, not current defect lists or implementation orders; recheck before acting |
| [Awesome DESIGN.md library](references/awesome-design-md/README.md) | Optional inspiration, never an automatically adopted specification |

Load only the spec sections, source paths, and skill references needed for the current task. No nested AGENTS files are currently necessary: shared engineering rules cover the existing feature modules. Add scoped instructions only for a distinct subsystem with rules that cannot be expressed clearly here; never duplicate global rules.

## Lifecycle for substantial work

Substantial work includes new capabilities, cross-module behavior changes, major visual work, architecture changes, and changes to provider/security/deployment contracts. Small, self-contained fixes and documentation edits can use the request plus concise acceptance criteria without creating a feature spec and plan. This exception does not waive verification or protected-change approval.

1. **Research.** Read the request, applicable guidance, existing architecture and tests. Identify behavior to preserve, dependencies, evidence, unknowns, and material assumptions. Use official technical documentation where implementation depends on external APIs. Inspect existing Graphify output when available; indexing is a separate scoped operation. Do not turn a narrow task into a system audit.
2. **Specify.** Use installed `agent-skills:spec-driven-development`. Write `specs/<feature-id>.md` before code. For multiple independently testable capabilities, first propose a small capability map with stable IDs, responsibilities, dependencies, and build order in `specs/<initiative-id>.md`; obtain review before module specs. Keep contracts at module boundaries and avoid cyclic dependencies.
3. **Review.** Present the concrete draft, assumptions, alternatives, risks, and unresolved questions. A new substantial feature spec must be approved before implementation; record who approved it, when, and the reviewed scope/version (a user message reference is sufficient). Do not call a draft approved because the agent wrote it. Existing explicit approval remains valid; do not request it again. Resolve blocking requirements before advancing dependent work.
4. **Plan.** Write `plans/<feature-id>.md` linked to the reviewed spec. Include dependency order, focused verifiable slices, affected files, acceptance checks, risks, and recovery steps where relevant. Keep task checkboxes in this same file. Show material new decisions for review; ordinary implementation details within the approved specification do not require a new approval gate.
5. **Implement.** Execute approved slices autonomously. Read callers and existing patterns first; keep rendering separate from domain/data orchestration. For changed logic or bug fixes, add meaningful tests, preferably reproduce the failure before the fix. Do not add tests that merely restate trivial edits. Update plan progress after meaningful milestones, including decisions and blockers.
6. **Verify.** Map acceptance criteria to actual evidence. Run the four checks in AGENTS.md. Inspect runtime behavior for application changes; significant UI work also needs screenshots, interaction/accessibility checks, and performance evidence against the spec's budgets. Record environment and limits. A build/test pass does not prove live provider availability, deployed-origin CORS, or visual correctness.
7. **Document.** Update the spec to reflect reviewed changes and the plan with completed milestones, command results, evidence paths, remaining limits, and deferred work. Update operational/design guidance when affected. Finish with changed files, validation results, and concerns. Keep specifications and plans in version control with the work when a commit is requested; never commit automatically.

## What a spec and plan must contain

Use these content requirements rather than copying an entire third-party template. Link to stable shared rules instead of repeating them.

A **spec** includes status (`draft`, `approved`, `in-progress`, `verified`, or `superseded`), objective/user needs, scope/non-goals, relevant current behavior, requirements with stable IDs, design/architecture decisions and alternatives, interfaces/data semantics, constraints, measurable acceptance criteria, testing/verification strategy, open questions, and approval/change history. Include relevant commands, source locations, an existing code-style example for code work, and always/ask-first/never boundaries (links to AGENTS.md suffice for unchanged conventions).

For Living World work, define mode behavior, accessible HTML interaction, camera/reduced-motion/fallback behavior, data-driven environment semantics, asset provenance, and performance budgets with target hardware/browser and measurement method before implementation. The confirmed island direction in AGENTS.md is product context; rendering-library selection and numeric budgets remain undecided.

A **plan** includes the spec link and reviewed scope, dependency order, task checkboxes with affected paths and acceptance/verification steps, milestone status, evidence, and risks/deferred items. Give every requirement a verification destination; use requirement IDs to connect tasks and results. Record failed checks and unverified conditions as such.

## Change control and autonomy

Do not silently change approved requirements, budgets, or acceptance criteria to fit an implementation. Propose a revision with its reason and effect, obtain approval for material scope/architecture changes, then record the decision before dependent implementation. Continue unaffected work while a blocking question is pending. Keep superseded decisions traceable.

Normal, well-specified implementation and verification proceed without repeated permission requests. Approval is required before fundamentally changing approved architecture, deleting working functionality, adding major dependencies outside the spec, discarding/overwriting existing work, or changing deployment/secret management. Preserve pre-existing modifications and untracked tooling. Commits require an explicit request.

Project adaptation of Agent Skills: `specs/` replaces root `SPEC*.md` defaults; `plans/<feature-id>.md` replaces `tasks/plan.md` and `tasks/todo.md`. Do not create parallel task registries or invoke upstream build shortcuts that assume different paths. The user's autonomy policy replaces per-phase human signoffs for ordinary approved implementation; review substantial new requirements and material changes, then continue through plan, execution, and verification within that authorization.

## Guidance consolidation (2026-11-02)

- Preserved strict typing, Zod validation, replaceable adapters, data-status vocabulary, honest refresh timestamps, key secrecy, optional prayer behavior, desktop sizes, reduced motion, and no-commit policy.
- Retained current Currents/Finnhub static pipelines as the baseline. Older GDELT/TradingView preferences apply to reviewed future choices, not automatic replacement of working integrations.
- Kept the clock-first information hierarchy while recording the confirmed island direction. Dashboard-specific tokens remain incumbent guidance; future approved root DESIGN.md owns Living World visual decisions. No design specification is created by this workflow setup.
- Consolidated engineering rules in root AGENTS.md, with this workflow and a routing table instead of duplicate agent files or copied skill manuals. Existing audits remain historical; vendor reference documents remain reference-only.
- Preserved installed skill/configuration files and hook settings. Added no hooks, dependencies, framework, system audit, or application implementation. Existing duplicate-selector and tooling limitations are documented in agent-tooling.md; this session does not claim to resolve them.
