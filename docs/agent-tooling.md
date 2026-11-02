# Ambient Brief agent tooling

Verified on **2026-11-02**, on branch `redesign/living-world-v2`. This setup prepares tooling only. No redesign, product specification, application source, application dependency, or deployment configuration was changed. No commit was created.

## Environment and initial inspection

- macOS, Darwin 25.5.0, Apple Silicon arm64; Codex CLI **0.146.0** at `~/.local/bin/codex`.
- Node **26.13.0**, npm, uv, Python, and Google Chrome are available. Graphify's existing uv environment uses Python 3.13.
- Initial Git status was clean on `main`. Created the requested branch without discarding work; there were no Git conflicts. The sandbox required elevated access to write Git refs.
- Read the repository `AGENTS.md`. No additional ancestor `AGENTS.md` files were found at the home, Documents, or GitHub directories. There were no project `.agents` or `.codex` directories initially. Git hooks were sample files only; no `core.hooksPath` override was set.
- Existing user integrations included Agent Skills 0.6.15 and Ponytail 5.3.3, plus older standalone Ponytail skills and Impeccable. Kept existing plugins rather than reinstalling them.
- Codex also had its bundled app/browser/computer-use/visualization plugins and primary-runtime document/PDF/spreadsheet/presentation/template plugins. These unrelated integrations were preserved.

## Results and invocation

The invocation column uses **Codex CLI/IDE `$skill` syntax**. In desktop skill selectors, select the corresponding skill by name; some upstream instructions describe this as `@skill`. Claude Code plugin commands are not Codex commands.

| Repository | Installation type | Status | Invocation | Notes |
| --- | --- | --- | --- | --- |
| [Agent Skills](https://github.com/addyosmani/agent-skills) | Existing native Codex plugin | Verified | `$agent-skills:spec-driven-development` | 0.6.15; all 25 skills discovered, including spec-driven-development. No specs created. |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Existing native Codex plugin | Verified; hooks pre-existing | `$ponytail:ponytail` or `$ponytail:ponytail-review` | 5.3.3; six plugin skills discovered. Existing hook trust was preserved, not granted by this setup. |
| [Graphify](https://github.com/Graphify-Labs/graphify) | Existing official `graphifyy` uv package + project Codex skill | Verified | `$graphify`; terminal `graphify --help` | 0.9.99; executable and TypeScript parser checked. No indexing or hooks enabled. |
| [Caveman](https://github.com/JuliusBrussee/caveman) | Pinned project core skill | Verified; skill-only | `$caveman`; say `stop caveman` to stop | No CLI/proxy, telemetry runtime, routing, startup hooks, or automatic activation installed. |
| [Impeccable](https://github.com/pbakaus/impeccable) | Official Codex project installer | Verified; hooks disabled | `$impeccable`, e.g. `$impeccable critique` | npm 4.8.0; engine 0.1.18. Do not run `init` until specification/design work is authorized. |
| [Karpathy Guidelines](https://github.com/multica-ai/andrej-karpathy-skills/tree/main/skills/karpathy-guidelines) | Selected project skill | Verified | `$karpathy-guidelines` | Only the requested skill, not the repository's Claude rules or plugin. |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | New native Codex plugin | Verified | `$taste-skill:design-taste-frontend` | 2.1.5; exactly one current skill. Other historical names moved to separate repositories. |
| [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) | Pinned project reference library | Verified | Ask Codex to read `docs/references/awesome-design-md/design-md/<brand>/DESIGN.md` | 84 templates; not a runtime skill, not selected as the app's design. |
| [Design Review](https://github.com/Superfuture/design-review) | Project Codex adaptation | Verified; free local workflow | `$design-review` with screenshot, URL, or component | Ten-dimension rubric preserved; Claude tool references adapted; automatic telemetry removed; Pro upload requires a separate explicit request. |

All intended runtime skills were returned by Codex's actual `skills/list` API with no parsing errors in these integrations: **25 Agent Skills + 6 Ponytail + 1 Taste + 5 project skills = 37 skills**. The reference library intentionally does not appear as a skill. Full names and paths are in [verification evidence](agent-tooling-verification.json).

New project skills are available for discovery on the next turn; start a **new Codex session** to load the newly installed native Taste plugin and project configuration reliably. This chat's initial catalog may remain stale. Use `/skills` in CLI/IDE after restarting. Existing Agent Skills and Ponytail already worked in this session.

## Paths, versions, and installation methods

Exact reviewed commits, installed versions, and SHA-256 hashes of project resources are recorded in [agent-tooling-lock.json](agent-tooling-lock.json). Upstream repositories were downloaded into a temporary audit directory and inspected as files; their setup scripts were not blindly executed. Each repository's current README was read, together with relevant installer/source files.

### Agent Skills

Official instructions: [Codex setup](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/docs/codex-setup.md).

Existing official marketplace/plugin registration is enabled in the user Codex configuration. Installed at `~/.codex/plugins/cache/agent-skills/agent-skills/0.6.15`, commit `301b02b12bff98e4688e6984af6556802322bbde`. The manifest points at `./skills/`; shared references are retained. Its Codex manifest does not wire a hook. Installation on another machine uses:

```sh
codex plugin marketplace add addyosmani/agent-skills --ref 301b02b12bff98e4688e6984af6556802322bbde
codex plugin add agent-skills@agent-skills
```

The instruction skills have no mandatory package runtime. Individual workflows may need tools, such as Chrome DevTools MCP for the browser-testing skill; installing this pack does not install those tools. No workflow was run to create specs or change the app.

### Ponytail

Official instructions: [README](https://github.com/DietrichGebert/ponytail/blob/96608e078b2d5ea607c5c3b8b5a54d1c1fba6846/README.md) and `INSTALL.md`.

Existing native plugin at `~/.codex/plugins/cache/ponytail/ponytail/5.3.3`, commit `96608e078b2d5ea607c5c3b8b5a54d1c1fba6846`. The supported setup is `codex plugin marketplace add DietrichGebert/ponytail`, then `codex plugin add ponytail@ponytail`.

Inspected `hooks/claude-codex-hooks.json`, activation, mode-tracking, subagent, runtime, and configuration code. The manifest declares **SessionStart, UserPromptSubmit, and SubagentStart** command hooks, requiring Node. They read instructions and manage mode state under plugin data, inject guidance, and can respond to explicit default-mode or board-import commands. The mode tracker can spawn a background board importer on its specific command. State can be shared across sessions in the same project. This is executable lifecycle integration, not just Markdown.

Three trusted hook hashes already existed in the user configuration. This session did not approve hooks, change those hashes, or execute hook tests against the user's data. A fresh installation must have its hooks reviewed before the user grants trust through `/hooks`. The six names are `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, and `ponytail-help`, under namespace `ponytail:`.

### Graphify

Official instructions: [installation](https://github.com/Graphify-Labs/graphify#install). The official PyPI package is **`graphifyy`**, while the executable is **`graphify`**.

Verified existing `graphifyy==0.9.99` metadata, official repository URL, Python environment, executable symlink `~/.local/bin/graphify`, `graphify --version`, `--help`, and TypeScript parser import. The package lives in `~/.local/share/uv/tools/graphifyy`; no app dependency was added. Reproduction: `uv tool install graphifyy==0.9.99`.

Reviewed upstream commit `32e5efe935e6844ef39a5e33409e4efe848f2172` separately from the installed package; it is **not claimed as the installed wheel's source commit**. The registered skill is the one shipped in the installed 0.9.99 wheel.

`graphify install --project --platform codex` first failed because the sandbox protects `.codex`. Source inspection established that the complete command also adds always-on AGENTS instructions and a Codex hook. To retain on-demand discovery and avoid hook approval, used the package's own `graphify.install.install(platform='codex', project=True, project_dir=<temporary directory>)` skill-only routine, then registered its unchanged Codex `SKILL.md`, reference sidecars, and version stamp at `.agents/skills/graphify`. No partial `.codex` skill install remained. `AGENTS.md` was not changed.

Python >=3.10 and the package's parser/graph dependencies are required. Optional PDF, media, MCP, database, provider, and watch extras were not installed by this task. Semantic extraction may use model/provider credentials or agent delegation; parallel extraction needs the host's agent support. No global multi-agent feature was changed. No graph was generated or service called.

### Caveman

Official instructions: [INSTALL.md](https://github.com/JuliusBrussee/caveman/blob/2e068f735253cce28256744804785f01887d9646/INSTALL.md). Reviewed `install.sh`, the unified `installer/install.js`, and the core skill before installation.

The full installer detects multiple agents, installs integrations, can write hooks/statusline/global files, and can lead into the newer Caveman CLI setup. The current full CLI includes routing and usage telemetry; it is unnecessary for installing a voice skill. The official docs explicitly provide a **skills-only** option. Selected only `skills/caveman` at commit `2e068f735253cce28256744804785f01887d9646` with Codex's skill-installer helper into `.agents/skills/caveman`.

Core voice skill has no runtime dependency and no telemetry. Optional sibling skills, including `ultracave`, `megacave`, compression, and CLI management, are **not installed**; aliases to those modes are unavailable. Invoke the basic `$caveman` only. Installing the skill did not activate its response style.

### Impeccable

Official instructions: [installation](https://github.com/pbakaus/impeccable#installation). Reviewed npm metadata, the platform shim, installer flag handling, and hook-manifest source at commit `c3c94b960276a42a235d1ff68e9954a342e5407e`.

Executed the official installer with `impeccable@4.8.0 install --providers=codex --scope=project --no-hooks --yes`, with npm lifecycle scripts disabled, `DO_NOT_TRACK=1`, and npm/engine caches directed to temporary audit paths. Installed skill files, reference material, agent definitions, and engine 0.1.18 at `.agents/skills/impeccable`.

The generated 17.7 MB macOS engine is usable locally but excluded from version control by `.agents/.gitignore`; the launcher, engine version, and checksum manifest are retained. Other machines use the launcher's verified download or rerun the pinned installer. Node is required for npx installation; the engine runs natively afterward. The npm package integrity is in the lock record. The installer retrieves its skill distribution separately, so the committed file hashes are the authoritative record of the installed skill bundle.

No hook manifests were generated. `.impeccable/config.json` explicitly sets `hook.enabled=false` and `telemetry=false`; `impeccable hooks status` confirms **disabled**. The installed hook documentation describes per-edit checks and completion checks and requires separate Codex `/hooks` trust if enabled later.

Runtime cautions: new-design catalog requests can still occur even with telemetry disabled. Live-mode Apply can fall back to a Codex/Claude subprocess with permission checks disabled, as documented upstream. Live mode, Apply, `init`, detector hooks, and image generation were not run. Review those operations separately before enabling them.

### Karpathy Guidelines

Installed only `skills/karpathy-guidelines` from the requested fork at commit `2c606141936f1eeef17fa3043a72095b4765b9c2` into `.agents/skills/karpathy-guidelines`, using Codex's skill-installer helper with `--ref` and a project destination. Valid name/description frontmatter; no scripts, hooks, services, or runtime dependencies. No `CLAUDE.md` ruleset was installed.

### Taste Skill

Official instructions: [Codex plugin section](https://github.com/Leonxlnx/taste-skill#install). Audited `.codex-plugin/plugin.json`, marketplace metadata, skill metadata, and CLI entry points. Registered the marketplace pinned to commit `12af471f627f866411b4bd785b19646d3672784c`, then installed through the official native method:

```sh
codex plugin marketplace add Leonxlnx/taste-skill --ref 12af471f627f866411b4bd785b19646d3672784c
codex plugin add taste-skill@taste-skill
```

Installed at `~/.codex/plugins/cache/taste-skill/taste-skill/2.1.5`; the installed Git commit matches the audited commit. The plugin declares no hooks or MCP server. Its only skill is **`design-taste-frontend`**, physically under `skills/taste-skill/SKILL.md`; the directory name is not the invocation name. Verified CLI help for `scripts/inspect.mjs`. Node >=22 and Chrome/Edge/Chromium are needed for the full browser workflow; both Node and Chrome are present. Image discovery needs network access and requires observing source licenses/credits. A full design/browser workflow was not run during setup.

### Awesome DESIGN.md

Official instructions: [README](https://github.com/VoltAgent/awesome-design-md/blob/fcc70284932276d085f01ef9f83edde90b1258cb/README.md). No executable Codex skill was found.

Vendored the 84 `DESIGN.md` templates, accompanying Markdown, README, contribution guidance, and license at commit `fcc70284932276d085f01ef9f83edde90b1258cb` into `docs/references/awesome-design-md`. Preview media are omitted. No runtime dependencies, hooks, restart, or skill registration. Read a chosen template on demand; none was promoted to a root `DESIGN.md` or adopted as Ambient Brief's design direction.

### Design Review

Official instructions: [README](https://github.com/Superfuture/design-review/blob/d4d2609b53fccb475d11490e2c6261e5eb2f0c5d/README.md). Upstream supports Claude Code installation and manual skill copying. It does not provide a native Codex plugin.

Copied the portable free skill and unchanged ten-dimension `checklist.md` at commit `d4d2609b53fccb475d11490e2c6261e5eb2f0c5d` into `.agents/skills/design-review`. Adaptation notes are alongside the skill in `ADAPTATION.md`. Replaced Claude `Read`/`WebFetch` and activation commands with available Codex file/image/web/browser tools. Preserved ranked findings, concrete fixes, Strengths, and opt-in application of fixes.

Removed the automatic anonymous usage ping using upstream's documented opt-out. Replaced automatic license checks, implicit external Pro artifact upload, and upsell with a separate explicit opt-in. No metrics or Pro endpoint was contacted. The free skill needs no package runtime; rendered visual review needs a screenshot or a usable browser tool. Source-only review must state its limitations. No application design review was performed in this setup.

## Scope, conflicts, and verification limits

The only new user-level configuration is **Taste Skill's native marketplace and plugin registration**, which the official installer requires. Existing global skill files, plugin registrations, hook trust, model settings, and feature flags were preserved. Native registrations remain machine-local, not bundled into this repository.

Project `.codex/config.toml` contains seven path-based exclusions for existing standalone Ponytail skills and the older global Impeccable skill. Codex `config/read` confirms the effective entries are `enabled=false`. However, in this CLI version `skills/list` still reports those global entries as enabled. **Duplicate suppression is not verified.** Restart Codex and check `/skills`; prefer the namespaced native Ponytail skills and explicitly select the project Impeccable path. If duplicates persist, address them in a separate user-approved global cleanup rather than deleting existing tools here. These absolute-path exclusions are specific to this machine and need adjustment for other users.

The global `~/.codex/skills/export-for-kiro/SKILL.md` has a pre-existing YAML parsing error, reported by Codex discovery. It is outside this task and was left unchanged. It does not prevent the 37 intended skills from being discovered.

Several packs overlap in design, simplicity, and review guidance. Invoke the intended workflow explicitly. Product requirements in `AGENTS.md`, strict types, external-response validation, data integrity, and the user's requested scope take precedence over stylistic defaults. No provider/service credentials, browser MCP servers, or automatic trust were added to satisfy optional workflows.

Verification performed:

- Actual native plugin registration/version checks and installed Git commit checks.
- Codex app-server initialization plus `skills/list(forceReload=true)` and effective `config/read`, without starting a model turn or invoking lifecycle hooks.
- Graphify executable/version/help and TypeScript parser import; Impeccable engine probe and disabled-hook status; Taste inspector help and browser prerequisite presence.
- `npm test`: **31 files, 160 tests passed**. `npm run lint`, `npm run typecheck`, and `npm run build`: **passed**. Tests emit Node's existing experimental localStorage warnings.
- Git scope check: only tooling directories and documentation were added. `AGENTS.md`, app code, package manifests/lockfile, and deployment files remain unchanged. Production build output remains ignored.

No end-to-end redesign, graph extraction, live browser editing, optional Pro service, or lifecycle-hook execution was used as an installation test. Restart-required discovery and the duplicate-selector behavior are the remaining operational checks.
