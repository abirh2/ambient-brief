# Living World — visual acceptance and evidence

Status: **draft acceptance checklist**, v0.1, 2026-11-02. The specification-authoring evidence below is real; application visual, motion, accessibility and performance gates remain **not run**. No Living World implementation exists from this task. Art references are not screenshots.

Read [DESIGN.md](../DESIGN.md), [world/art](../specs/04-world-and-art-direction.md), [camera/motion](../specs/05-camera-and-motion.md) and upstream [acceptance requirements](../specs/08-acceptance-criteria.md). This adds visual evidence destinations without replacing or lowering AC-F01–AC-F16, AC-N01–AC-N06, AC-I01–AC-I04, AC-D01, AC-S01/AC-S02, AC-O01, AC-E01 or PF-01–PF-06. F01–F16 and R01–R13 keep their audit meanings.

## Evidence protocol

Record each check as **pass / fail / blocked / not run**, with revision, tester/date, device/OS/browser/version, viewport in CSS px, display scale/DPR, motion/density/glass settings, enabled features, input fixture and expected/observed result. Attach screenshot/video/trace paths in the future implementation milestone record under `plans/`; do not invent a passing screenshot filename. Store exact font files, quality tier and resource counts. An outstanding major art issue, missing device or untested scenario is not a pass.

Capture the actual production preview for final UI evidence; use controlled development/test fixtures for representative data/failure scenarios, labeled as fixtures in the evidence. Never introduce realistic fixtures into production fallbacks. Existing DEV tools do not simulate every domain and are insufficient alone (FR-16). Verify production demo exclusion separately. Browser automation and screenshots are complementary to keyboard/screen-reader inspection; source inspection alone cannot prove appearance, motion or accessibility.

## VA-00 — Specification and concept authoring (this task)

| Evidence | Result / limitation |
| --- | --- |
| Required context | Read AGENTS/workflow/routing/README; product, functional, data/interaction and acceptance specs; technical audit, feature inventory and existing data contracts |
| Confirmed direction | User selected temperate Atlantic coast through the structured question in this session; no detailed visual approval inferred |
| Skills/references | Impeccable, Taste app-screen guidance, Agent Skills specification/frontend guidance, Design Review rubric, imagegen; Oura/Mercury reference excerpts used selectively as documented in DESIGN.md |
| Scope | Four requested design/checklist documents plus two supporting generated PNG concepts and their prompt/provenance JSON; no app implementation, package installation, provider call, contract edit, commit or deployment |
| Overview reference | Built-in image generation succeeded; inspected actual output for silhouette, materials, art style and negative space |
| Observatory reference | Built-in image generation succeeded using overview as style/identity reference; inspected actual output |
| Token calculation | Relative-luminance contrast calculated from proposed opaque sRGB pairs; results below. This does not test actual transparency, font rendering or atmosphere |
| Documentation validation | PASS — local relative links resolve, referenced requirement IDs have definitions, fences balanced, new-file whitespace checked. Tracked diff is empty; pre-existing untracked specifications preserved |
| Existing-app commands | PASS — `npm run test`: 31 files / 160 tests; `npm run lint`: zero warnings/errors; `npm run typecheck`: pass; `npm run build`: pass. macOS arm64, Node 26.13.0, npm 11.20.0. Existing experimental localStorage warnings in tests; no world implementation exercised |
| Runtime visuals/accessibility/performance | **Not run**; no application UI or motion was implemented. No screenshot, focus, CORS, GPU, device or eight-hour pass claimed |

Concept images: [Overview](design-references/living-world-overview-concept.png), [Observatory](design-references/weather-observatory-concept.png); [exact prompt/provenance record](design-references/concept-provenance.json). Neither image is approved production artwork. No externally sourced model/photo/font was downloaded for use in the application.

Both generated images are 1672×941 pixels. They were inspected at their actual generated dimensions; they are not captures at the supported application viewport sizes. Browser tools were not used to run or claim visual evaluation of the unimplemented world. Existing application commands verify baseline preservation only.

### Ranked concept review

This is a Design Review of the **generated images**, not of a running interface. Typography, control states, input/focus, reflow and animation cannot be scored from these UI-free art plates.

| Severity | Finding / why | Concrete correction and disposition |
| --- | --- | --- |
| Blocking for use as a screen composition | Observatory plate puts foliage/architecture into the future left rail and lighthouse into the right-sheet zone; there is no demonstrated room for persistent OV-02 content | Use CM-01's conservative center lane, move the roof/terrace projection between x392–934 at 1366×768 and protect both reading surfaces. Keep this plate as architecture reference only; not a layout pass |
| Important | Both plates lean toward photoreal stone rubble, foliage and water glitter; this competes with a calm stylized island and implies unbudgeted detail | Replace microdetail with 2–3 broad rock strata per cliff face, grouped pine masses and low-frequency sea shading; evaluate at 320 px thumbnail and full viewport. WA-02/WA-03/WA-07 make this a final-asset gate |
| Important | Focused plate visually separates the far lighthouse promontory and adds a distant mountain horizon | Enforce WA-01 connected eastern ridge/path; horizon may have low haze silhouettes only, not a second authored mountain world. Verify plan and focused-camera continuity before approval |
| Polish | Overview signal house is comparatively small and partly visually merged with vegetation | Reserve a foliage-free silhouette around roof/mast; test ≥36 px main-building short dimension and ≥16 px landmark gaps at minimum desktop |

Strengths: four distinct architectural silhouettes are visible in Overview; pale paths tie the landscape together; cedar/stone/bronze form a consistent palette; the observatory's thin canopy and glass hall provide a recognizable central motif. Highest-priority next visual proof: a final-geometry composition inside the real HTML safe areas. None of these observations certifies final asset quality or rendering feasibility.

### Opaque token contrast calculations

Computed using sRGB linearization and `(lighter luminance + 0.05)/(darker luminance + 0.05)` on 2026-11-02. Against DS-03 `ui.surface`:

| Pair | Day | Night |
| --- | --- | --- |
| Primary text | 11.76:1 | 13.56:1 |
| Secondary text | 5.53:1 | 8.81:1 |
| Action/focus | 5.90:1 | 9.02:1 |
| Positive change | 6.30:1 | 9.15:1 |
| Negative change | 6.03:1 | 8.96:1 |
| Caution text | 6.19:1 | 10.09:1 |

Critical text on critical surface: 10.27:1. All listed opaque text pairs exceed 4.5:1. Separator colors are decorative and not approved as essential focus/control boundaries. Raised/hover/disabled, translucency, text over art and composited focus states still require VA-03 measurement.

## VA-01 — Coverage matrix and minimum evidence set

Test all six compositions at **1366×768, 1440×900, 1920×1080 and 3440×1440**, 100% zoom. Also test **1024×768, 768×1024, 390×844 and 320×568**, plus desktop at 200% zoom and a short landscape viewport. Desktop tests include defaults and prayer/Hijri enabled, all six companies selected, one/three topics, comfortable/compact and both opacity extremes. Full upstream state matrix is exercised at every desktop size; save representative captures and a result table for all combinations, rather than asserting unseen states passed.

| Composition | Required captured variants | Parent requirements |
| --- | --- | --- |
| Overview | First load, normal day, night, all optionals on, long headlines/place name, detail open without camera move, critical alert | PV-01/PV-02/PV-06, OV-01–OV-04, AC-N01 |
| Observatory | Six/eight forecast rows, pollutants, rain/fog/snow, weather unavailable/cached, alert unavailable vs none | FR-03–FR-06/FR-09/FR-10, AC-F03–AC-F06/AC-F09/AC-F10 |
| Lighthouse | Prayer off/on, schedule expanded, Hijri off with cache, midnight/after Isha, missing tomorrow, invalid timezone | FR-01/FR-12, AC-F01/AC-F12/AC-I01 |
| Signal station | One/three topics, full list, empty topic/feed, partial/stale, broken image, long titles | FR-07, AC-F07/AC-I03 |
| Pavilion | All proxies + six selected companies; row partial/missing change; market/currency independently off; unsupported pair | FR-08/FR-11, AC-F08/AC-F11/AC-I03 |
| Ambient | Entry, 10 s recession, focused control prevents recession, first tap, offline/critical alert, reduced motion | AM-01–AM-04, AC-N04/AC-N05 |

For each mode, include FS-01's applicable loading, refreshing, empty, cached, stale, partial, error/unavailable, disabled/unsupported and context-switch states; explicit demo only in development. Repeat modal/lazy-loading failure, no-WebGL, missing model/texture, context loss, retry failure and success. Test a provider failure independently of renderer failure. Data from one domain failing must not remove others.

## VA-02 — Composition and art

- [ ] Clock remains the largest text and primary scan anchor in all six screens; concise weather second, news before markets/context. Detailed weather never overtakes it.
- [ ] At supported desktops, complete OV-02 summary fits initial viewport without document scroll, clipped controls or missing required values. No focus ring hidden beneath ledger/utility/detail. Images/descriptions/world area yield first.
- [ ] DS-05 geometry matches the actual viewport; document any departure with rationale. Unoccupied world area target ≥55% Overview/Ambient and ≥30% focused detail, subordinate to readability. Do not count transparent text regions as unobscured world.
- [ ] Overview has all four connected landmark silhouettes, ≥16 px separation, ≥36 px building short dimensions, and continuous visible path branches; no separate-island interpretation.
- [ ] Focused camera uses CM-01's relative scale, roof/lantern clearance and second-landmark/coastline continuity. No landmark hidden by sheet/alert/rail. Overview detail opens without camera refit.
- [ ] Terrain and vegetation follow WA-01–WA-03: 3-scale forms, grouped species, bevel/material scale consistency, no stock primitive/voxel final assets or colliding kit styles.
- [ ] Day/night/overcast/snow/fog retain architecture and surface depth; no clipped highlights, black unlit station or water glitter dominating data. Grayscale thumbnail still separates main forms.
- [ ] At most three dominant glass surfaces; no card grid, nested blur, neon edging, floating numeric labels or invented instrument readings.
- [ ] Native and fallback fonts match measured hierarchy; tabular clock/price widths stable, no seconds/price layout jitter, font load CLS within PF-01.
- [ ] Long content has full accessible names and local disclosure; summary truncation does not remove publisher/age/proxy/unit/state. All selected companies/stories remain reachable without Journey.

Evidence: six resting screenshots per target size plus representative state captures, annotated projected bounds, style critique ranked blocking/important/polish and product-owner art decision. Numeric compliance is necessary but not sufficient for final art approval.

## VA-03 — Contrast and responsive accessibility

- [ ] Normal text ≥4.5:1; large text ≥3:1; essential icon/control/focus boundary ≥3:1. Measure actual composited pixels in day/night, bright foam/snow/sunset and both glass extremes; include raised/hover/selected/disabled/loading/error states.
- [ ] Text clusters have opaque backing including focus perimeter. No motion/particle crosses them. Color grading does not tint HTML. Test blur unavailable and forced-colors mode.
- [ ] Essential type floor 14 px metadata, 16 px body, clock larger than temperature. Touch controls≥44×44 px; inline targets≥24×24 px with spacing. No hover-only data or source timestamp.
- [ ] 200% zoom and 320 CSS px reflow with no two-dimensional page scrolling; normal document scroll permitted. Font/text expansion does not clip data or modal controls.
- [ ] Narrow/tablet have full data and chapter equivalence, still/omitted island explained, no page-scroll-driven camera or fixed-height traps. Orientation changes preserve focus/current mode.
- [ ] Form labels/errors are explicit; mode/topic/expanded states conveyed semantically; no positive/negative/alert/freshness distinction by color alone. Decorative canvas not in reading tree.

Evidence: contrast sampling report, zoom/narrow screenshots, accessibility-tree inspection and manual assistive-technology notes. No WCAG compliance claim solely from token arithmetic or automated scans.

## VA-04 — Keyboard, touch and focus

- [ ] Keyboard-only path reaches every station, mode, source detail, forecast/story/company expansion, prayer schedule, refresh, settings, alert and recovery action. Tab order follows IN-06; no canvas interaction required.
- [ ] Direct navigation focuses destination heading once after settlement. Scroll change announces once without focus theft. Clock seconds/countdown never flood announcements.
- [ ] Panels are nonmodal unless explicitly shown as modal; modal Tab/Shift+Tab is contained and close restores invoker. Nested provider dialog closes to Preferences. Escape affects only highest-priority layer.
- [ ] Stop visible while moving, keeps focus; Return closes detail and focuses Overview. Canceled old completion cannot steal focus from later station/dialog.
- [ ] Touch panel scrolling stays local at endpoints; pinch zoom/text selection work; pan does not trigger landmark click. First Ambient link tap activates link, not merely restores controls.
- [ ] Loading Preferences has visible status, retry on failure and usable close; storage-denied state reports session-only changes. Existing consent/search/settings/migration actions preserved (AC-F02/AC-F13).

Evidence: keyboard/touch recording, actual focus log and screen-reader announcements (name exact screen reader/browser). All AC-N03/AC-N06 obligations remain.

## VA-05 — Camera/motion and interruption

- [ ] Cold load/reload has no fly-in; Overview/Ambient have no orbit, pointer parallax, idle drift or scene movement caused by refresh/disclosure/topic hover.
- [ ] All ten unordered station/Overview pairs pass forward and reverse paths, plus re-target at 25/50/75% and scroll release at 10/49/50/90%. Review every 5% path sample for collisions/occlusion.
- [ ] Direct paths 0.8–1.6 s, hard maximum 2 s; zero roll/overshoot; input feedback immediate. Record actual timings and frame trace, not declared CSS values alone.
- [ ] Journey scroll begins only inside labeled region; 200 ms no input settles within 500 ms; no repeated advance from inertial residuals; outside wheel/panel endpoints/native input keys never navigate world.
- [ ] Stop/Escape when camera owns Escape freezes within 100 ms of handling; hold retains prior settled content; Continue/another station/Overview are explicit. No queued tour or snap to old start.
- [ ] Test modal, settings, critical alert, hidden tab, resize, renderer loss and new nav during travel and scroll settling. Latest valid intent wins; no automatic resume on modal close/visibility/motion re-enable.
- [ ] OS reduction OR app reduction OR Static gives instant still views with no particles/fades/parallax or continuous decorative loop. Toggle during movement takes effect ≤ 100 ms; keep all chapters/controls.
- [ ] Ambient tool recession at 10 s never dims data or hides focused controls; controls restored immediately by valid input; no idle mode auto-entry/exit.
- [ ] Newly Severe/Extreme official alert cancels/reveals banner without mode change/focus theft/flash/sound/modal. Unchanged rechecks do not reannounce. Expiry/context changes clear its world cue under IG-02.

Evidence: video with input timestamps, camera pose trace and narration/focus log; 60 s settled-state pose comparison and eight-hour check. Parent AC-N02–AC-N05 and PF-05 remain authoritative.

## VA-06 — Environmental/data truth

- [ ] Exercise morning/day/golden-hour/twilight/night × clear/cloud/overcast/rain/storm/fog/snow/unknown, paired with the same accepted HTML state. Distinguish observed facts from illustration.
- [ ] WA-05 valid sun times, absent sun times, short daylight, local midnight, invalid timezone, device clock jump and location changes behave as specified. Approximate art never supplies a fabricated sunset number.
- [ ] Accepted weather blends for 2 s, immediately updated HTML/status; re-target from current blend; old-context signal neutralizes immediately; reduced motion applies new still state instantly.
- [ ] Snow only from supported current condition; forecast probability never becomes current rainfall; no snow-depth/wind/visibility/AQI measurement inferred from geometry.
- [ ] Cached/stale/delayed/reference/demo states retain adjacent scope/age. Scene qualifier visible, unknown observation time unknown; no Live from network/cache success. Last check distinct from source time.
- [ ] Unknown/unavailable weather becomes neutral, not clear; expired cache/old-context weather has no active signal. Missing AQI yields no pollution haze; fog cannot replace AQI data.
- [ ] No provider requests on camera/mode/frame/hover. Markets/news remain static-pipeline reads; no Actions dispatch or exposed key. Match same accepted domain context in HTML and world.
- [ ] Partial/missing quote never zero, carried category never false new time, prayer cache/next-date never implied current by lantern. Disabled modules have no fabricated service activity.

Evidence: controlled fixture matrix with screenshot/status pairing, request traces and IG-01–IG-04 proof. This task applies none of the audited integrity fixes; their later verified completion is a prerequisite to accepting data-driven world behavior.

## VA-07 — Load, rendering, power and fallback

- [ ] Record exact Reference A/B devices from PF requirements, OS/browser versions, power/thermal state, display refresh, viewport/DPR, effective quality/internal resolution and production revision. Missing exact-device access is blocked evidence, not emulation success.
- [ ] PF-01/PF-02 cold-run protocol: shell LCP ≤ 2.5 s, CLS ≤ 0.1, world-ready ≤ 6 s; JS/asset budgets including decoders/transitive chunks measured, source HTML remains usable during failures.
- [ ] PF-03 runtime traces: ≥30 FPS, p95 frame interval ≤ 40 ms, p99 ≤ 66 ms; input p95 ≤ 200 ms through weather extremes/travel on largest target viewport. No dropping required overlays to pass.
- [ ] PF-04 counters: DPR ≤ 1.5, framebuffer ≤ 5M pixels; total ≤ 250k rendered triangles/200 calls including passes, decoded textures ≤ 96 MiB, tracked world resources ≤ 128 MiB. Report driver memory uncertainty separately.
- [ ] PF-05 eight-hour visible soak and ten-minute hidden interval: no clock/date/prayer/currency expiry drift, duplicate refresh or unbounded growth; retained heap increase ≤ 20 MiB and world resource growth ≤ 5% after comparable warmup/cycles. No routine hidden refresh/decorative callbacks within 1 s.
- [ ] PF-06 failure: still/HTML usable ≤ 1 s after error detection, essential HTML never removed. Retry repeated 20 times creates no duplicate provider owner/resources; successful retry lands instantly at stable selected pose.
- [ ] Static/reduced motion produces zero continuous decorative loop; low quality preserves silhouettes/material identity. All-data-unavailable and all-world-assets-failed still support settings/refresh/chapter access.
- [ ] Validate actual `/ambient-brief/` production subpath and no unapproved external model/font/texture request. Existing provider CORS/compatibility remains AC-O01, separate from art verification.

All numerical limits are inherited draft PF targets pending upstream review/device confirmation; they were not measured for the proposed world. Do not present low-power fallback as a passing P1 3D launch on a failed reference device.

## VA-08 — Asset and release readiness

- [ ] Each production asset/font has author/source/license evidence, redistribution rights, attribution, version/hash, transformations and approval; generated concepts distinguished from commissioned final geometry/stills.
- [ ] Four bespoke final landmark silhouettes, connected terrain, shared materials and LODs pass WA-02/WA-03/WA-07; no temporary primitive slips into a final screenshot.
- [ ] GLBs validate; bounds/units/normals/UV/color interpretation correct; optional extensions/decoders compatible and locally served; no unowned helpers/cameras/autoplay animations in payload.
- [ ] Final still fallback matches final island identity and is independently legible day/night; image failure falls back to usable DOM. No pixel-embedded essential numbers/controls.
- [ ] Product owner records final subjective art/composition approval; detailed design/architecture/upstream approvals have accurate records. All P0/P1 gates pass; P2 extras documented as optional.
- [ ] Required tests/lint/typecheck/build pass against final implementation; sources/specs/plans agree. No credential/deployment/provider ownership changes hidden in visual work.

## Contradictions, tradeoffs and unresolved decisions

New visual requirement coverage:

| Requirement group | Verification destinations |
| --- | --- |
| DS-01/DS-02/DS-04–DS-09 | VA-01/VA-02/VA-03/VA-04/VA-06 |
| DS-03/DS-12 | VA-03/VA-04; token arithmetic in VA-00 supplements runtime evidence |
| DS-10 | VA-01/VA-06 and all applicable upstream AC-F/AC-I checks |
| DS-11/DS-13 | VA-05/VA-07 |
| WA-01–WA-04 | VA-01/VA-02/VA-03 |
| WA-05/WA-06 | VA-05/VA-06 |
| WA-07/WA-08 | VA-07/VA-08 |
| WA-09 | VA-00; concept-only review, not runtime acceptance |
| CM-01/CM-02 | VA-01/VA-02 |
| CM-03–CM-05 | VA-04/VA-05 |
| CM-06/CM-07 | VA-05/VA-06/VA-07 |

Decision register:

| Item | Disposition |
| --- | --- |
| Request says product specs approved; files say draft | Baseline followed as requested, existing files untouched; reconcile approval record before implementation. This visual package itself remains draft |
| Cinematic opening versus OV-01 no fly-in | Opening is a composed still establishing shot, not a camera entrance |
| Immersive island versus dense continuous OV-02 summary | Rail + ledger + reserved detail zone protects readings. Minimum desktop island is smaller; actual safe-lane visual approval still required, no silent content deletion |
| Generated art versus final stylization/layout | Images explicitly limited to art references; ranked findings above remain final-asset review obligations |
| Glass slider versus contrast | Slider changes panel perimeter translucency; opaque text/control backing protects contrast. Preserve existing range; actual compositing still untested |
| Skill templates versus pinned direction/document scope | Applied relevant design methods; no random theme substitution, duplicate PRODUCT.md, build phases, app code or extra permission gate |
| Geographic snow / atmospheric accuracy | Current normalized condition only; fictional Atlantic setting and approximate daylight explicitly disclosed |
| Upstream DEC-09/DEC-10 | Renderer/browser floor/resource mechanism/hardware access unresolved; PF targets inherited, not revised or measured |
| Upstream DEC-11 / R01–R04/R09 | Provider compatibility/entitlement and integrity remediation remain separate gates; no new data schema or fix authorized here |
| Upstream DEC-12 | Art/camera proposal supplied; asset creator, final license ledger, approved geometry/poses and fonts remain to be confirmed |

Review completes this specification task; it does not authorize planning, package installs or app implementation. Stop at the delivered design package. 2026-11-02 — v0.1 authored; final visual approval pending.
