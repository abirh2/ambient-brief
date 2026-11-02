# Skill routing

Start with [AGENTS.md](../AGENTS.md) and the task's scope. Select a primary skill for the current phase, then add a specialist only when it contributes a distinct check. Read the selected SKILL.md and only necessary sidecars; do not load every pack or run every workflow for every task.

Use Codex's discovered skill selector or `$skill-name` / `$namespace:skill-name` invocation. The names below match the installed catalog; slash commands shown in upstream Claude instructions are not assumed Codex commands. See [agent-tooling.md](agent-tooling.md) for versions, local paths, provenance, and known discovery limits. Do not reinstall tools or change global configuration just to select a workflow.

| Need | Installed skill / reference | Project use |
| --- | --- | --- |
| Substantial feature requirements | `agent-skills:spec-driven-development` | Research and specify before code; use `specs/`, review requirements, and follow the project's approval policy |
| Scope still unclear | `agent-skills:interview-me` or `agent-skills:idea-refine` | Clarify consequential uncertainty or explore alternatives before committing to a specification |
| Architecture and task planning | `agent-skills:planning-and-task-breakdown`, `agent-skills:api-and-interface-design` | Dependency order, feature boundaries, rendering/data contracts; plans and tasks stay in `plans/` |
| Quality budgets and unfamiliar APIs | `agent-skills:constraint-driven-development`, `agent-skills:source-driven-development` | Measurable spec constraints and official documentation; do not invent unsupported thresholds or add duplicate policy files |
| Implementation and testing | `agent-skills:incremental-implementation`, `agent-skills:test-driven-development`, `agent-skills:frontend-ui-engineering` | Thin verified slices, behavior tests, accessible HTML UI; preserve project architecture |
| Debugging | `agent-skills:debugging-and-error-recovery` | Reproduce, trace the cause, make the focused fix, verify |
| Code, security, or performance review | `agent-skills:code-review-and-quality`, `agent-skills:security-and-hardening`, `agent-skills:performance-optimization` | Use the specialist matching the risk; measure performance instead of guessing |
| Decisions, context, Git, and delivery | `agent-skills:documentation-and-adrs`, `agent-skills:context-engineering`, `agent-skills:git-workflow-and-versioning`; CI/launch skills when in scope | Record consequential decisions and manage focused context; workflow selection does not authorize commits, deployment changes, or shipping |
| Code relationships and architecture exploration | `graphify` | Query existing `graphify-out/graph.json`, then verify relevant source. If absent, inspect source directly for narrow work; generate/update an index only as scoped research, excluding vendored skill/reference corpora. No automatic watch/index hooks |
| Product UI/art direction and polish | `impeccable` (project `.agents/skills/impeccable`) | Main design-engineering workflow for scenes' HTML interfaces and product usability. Read its setup/playbook when doing design work; use approved project direction and future DESIGN.md |
| Distinctive visual direction | `taste-skill:design-taste-frontend` | Alternative or focused art-direction aid. Use its app-screen branch for dashboard controls; never replace the approved island direction with a random website template |
| Significant visual review | `design-review` | Rank rendered hierarchy, typography, states, accessibility, responsiveness, and brand findings with specific fixes. Complements the design workflow; source-only review must state its limits |
| Focused engineering judgment | `karpathy-guidelines` | Understand first, state assumptions, keep changes surgical, define success, verify; root rules already summarize these expectations |
| Minimum complete solution | `ponytail:ponytail` / `ponytail:ponytail-review` | Prefer existing primitives and remove needless complexity; never trade away requested visuals, validation, tests, security, or accessibility. Do not start a whole-repo audit unless requested |
| Explicitly requested terse chat | `caveman` | Optional reply style only. Keep persisted specs, plans, code, and documentation in clear standard English; retain technical facts and evidence |
| Visual reference research | [Awesome DESIGN.md](references/awesome-design-md/README.md) | Read selected `design-md/<brand>/DESIGN.md` files as references. This is a library, not an executable skill; do not copy a brand specification into root DESIGN.md without a reviewed project-specific design decision |

## Avoid overlap and side effects

- Choose Impeccable or Taste as the primary design workflow for a task; use another only for a defined contribution. Design Review is a review pass, not a competing product specification. No design workflow is needed for backend-only or documentation-only work.
- Prefer native namespaced Ponytail over legacy standalone copies and project Impeccable over the older global copy. Existing path exclusions have a documented discovery caveat; do not assume duplicates were removed.
- Follow the [project lifecycle and autonomy policy](development-workflow.md), including its explicit path and review adaptations of upstream spec/task defaults. Never use style or efficiency defaults to weaken approved requirements.
- Use available browser tools for rendered verification. `agent-skills:browser-testing-with-devtools` requires Chrome DevTools MCP; installing the skill does not supply the server. If unavailable, use an existing browser capability and state any verification gap rather than claiming a pass.
- Keep Impeccable hooks disabled and its project telemetry setting off. Do not add Graphify/watch/startup hooks, duplicate skill shortcuts, automatic uploads, or service credentials as a side effect. Native Ponytail's pre-existing hook trust is unchanged; do not add a second hook layer. Refer to installation notes before optional external-service or live-apply operations.
