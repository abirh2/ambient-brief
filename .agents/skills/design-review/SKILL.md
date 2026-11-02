---
name: design-review
description: Run a sharp, prioritized design critique of a UI — a URL, a screenshot/image, or a component file — covering visual hierarchy, typography, spacing, color & contrast, motion, component states, responsiveness, accessibility, and brand consistency. Returns findings ranked from blocking to polish, each with a specific fix; can optionally apply the fixes to code. Use when the user asks to review/critique a design, page, screen, component, or screenshot, or to check craft/accessibility before shipping.
---

# design-review

A senior-level craft critique. Opinionated and specific — not a generic checklist dump.

## Codex integration

Use Codex file-reading, image-viewing, web, and browser tools that are available in the current session. Do not call Claude Code's WebFetch, Read, or plugin commands. Inspect the actual rendered page with an available browser tool when possible; text-only fetches do not establish visual appearance. If a render cannot be captured, request a screenshot and viewport or state the limits of a code-only review.

Telemetry is disabled in this project adaptation. Never send usage pings or artifact content to external services automatically.

## 1. Acquire the artifact
- **Screenshot / image** → Inspect it with the available image viewer. Best for *visual* judgment (hierarchy, type, spacing, color).
- **Component / code file** → Read it (and related CSS/tokens). Enables implementation-level fixes
  with `file:line` references and `--apply`.
- **URL** → Use available web tools to inspect markup/CSS, and browser tools to capture a rendered screenshot at the target viewport. If browser capture is unavailable, request a screenshot and viewport. A text fetch alone is insufficient for visual judgment.
- If you have neither a screenshot nor code for a visual review, ask for one before guessing.

## 2. Evaluate against the rubric
Review against every dimension in `checklist.md`:
hierarchy & layout · typography · spacing & rhythm · color & contrast · motion ·
component states · accessibility · responsiveness · content & copy · consistency & brand.
Check actual numbers where possible (contrast ratios, line-heights, measure in ch, tap-target px,
animation durations) rather than vibes.

## 3. Report — ranked, concrete, scannable
Group findings by severity, most important first. **Lead with the few that matter; don't list
everything.** For each finding give:
- **What** — the specific issue (quote the element / `file:line` when code is available)
- **Why** — the craft or usability reason it matters (one line)
- **Fix** — a concrete, specific change (exact value, not "increase spacing")

Severity tiers:
- 🔴 **Blocking** — broken, inaccessible, or fails WCAG AA / unusable on a target device.
- 🟠 **Important** — noticeably hurts hierarchy, readability, usability, or consistency.
- 🟡 **Polish** — refinement that sharpens the craft.

End with **"Strengths"** (2–4 things done well — critique builds on what works) and, if useful,
the single highest-leverage change to make first.

## 4. Optional: apply fixes
If invoked with `--apply` (or the user asks), make the code edits for the **clear, safe** findings
(contrast, spacing values, focus states, reduced-motion, semantic tags, alt text). Leave subjective
or restructuring changes as recommendations unless the user confirms. Re-verify contrast/values after editing.

## Tone
Direct and respectful, like reviewing a colleague's work: precise about problems, never vague, and
always paired with the fix. Calibrate depth to the surface — a marketing hero gets motion/type
scrutiny; a form gets states/accessibility scrutiny.

## 5. Optional Pro service

The upstream optional Pro tier sends reviewed material to an external licensed service. It is not configured by this Codex adaptation. Use the complete free rubric locally. Only investigate or configure Pro when the user explicitly requests it, and explain the transmitted content before any upload. Claude Code's `/design-review:activate` command is not available here.
