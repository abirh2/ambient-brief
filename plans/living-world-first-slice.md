# Living World — isolated observatory slice

Status: **implemented and locally verified**, 2026-11-02. Approval: product owner's chat request “Implement the first approved Living World vertical slice”. This approves the scoped Fiber 9.8.2 / Three 0.187.0 / types 0.187.0 recommendation and Atlantic art direction for a development prototype. It does not approve production rollout or the full dashboard migration. Existing draft history is retained. Final art-owner acceptance and release gates remain open.

Authority: [DESIGN](../DESIGN.md), [architecture](../specs/03-technical-architecture.md), [world](../specs/04-world-and-art-direction.md), [camera](../specs/05-camera-and-motion.md), [budgets](../specs/07-performance-and-accessibility.md). This task is a scoped M07/M08 proof; the user's explicit one-landmark/no-domain-integration boundary supersedes M08's four-landmark/data-binding scope. Those broader milestones remain open.

## Design and implementation contract

One authored Atlantic island: asymmetrical limestone coast, sage grass shelves, grouped wind-shaped pines, curved stone approach, a detailed oval glazed observatory with bronze canopy and cedar fittings. Experience mode for scenery; Operate/Read for a minimal opaque limestone HTML rail. The opening camera is stationary. No automatic journey, free orbit, extra station, sample weather or domain requests. A device-clock reading is labeled separately from fixed illustrative art lighting.

Offline authored geometry is exported with the selected Three GLTFExporter; editable source recipe is versioned. Runtime loads that GLB, never generates random terrain. All original geometry, vertex materials and fallback captures are created for this repository under its MIT license. No external model/texture/font acquisition. System/Georgia fallbacks are explicitly permitted by DS-02; final self-hosted fonts remain later work. Asset ledger accompanies the export.

Prototype entry: `?world=observatory` in development, lazy imported after the existing bootstrap. An explicit `VITE_WORLD_PROTOTYPE=true` flag permits a local production-preview test. Ordinary production builds continue rendering the incumbent dashboard, including with this query, and emit no prototype JavaScript. No provider owners mount in the independent art study. No changes to deployed pipelines, secrets, authentication or settings schema.

Acceptance: one stable Canvas, isolated import/asset/WebGL/shader/context/render failures; bounded 15-second loading, explicit retry, local still then DOM fallback. HTML Overview/Select Observatory/Stop/Continue/Return controls; instant OS OR saved app OR Static reduction; no continuous renderer work while reduced/hidden. Current-pose interruption and stale-completion protection. All asset URLs base-relative.

Provisional targets retained: ≤200 calls / ≤250k rendered triangles including shadow passes; DPR≤1.5 / framebuffer≤5M; optional JS≤700KiB gzip; initial world≤8MiB; decoded textures≤96MiB / tracked resources≤128MiB. Report local initial performance, not reference A/B certification. Missing hardware, long-run/browser coverage and art-owner approval remain explicit gaps.

## Work and evidence

- [x] Isolated entry, approved packages, semantic shell, navigation tests.
- [x] Original authored/exported island, observatory and asset ledger.
- [x] Persistent renderer, camera driver, loading/error/context-loss and motion lifecycle.
- [x] Rendered visual review at 1366×768, 1440×900, 1920×1080, 3440×1440; keyboard/reduction/failure checks.
- [x] Initial profiling, subpath checks, four repository checks, update progress.

Recovery: remove the development query entry to hide all prototype code; existing dashboard remains untouched. No commit or deployment requested.

## Delivered implementation

- `src/main.tsx`: explicit entry only; ordinary production tree shaking removes the entire optional UI/renderer import.
- `src/app/WorldPrototype.tsx`: independent semantic HTML, device clock, camera intents, saved/OS/session motion policy, loading deadline, attempt-generation guards, world-only error boundary and still→DOM recovery. Essential controls never depend on renderer success.
- `src/features/living-world/`: renderer-neutral navigation/poses/budgets, generated asset manifest, scoped CSS, meaningful navigation/asset/import-boundary tests; lazy renderer owns the single Canvas, static model lifetime, camera and decoration pacing. No renderer API/provider/store imports.
- `scripts/world/author-island.mjs`: original editable offline model recipe, merged by named semantic root/material into a self-contained GLB. Includes stratified coast/cove, terraced meadow, paths/stairs, rocks, three pine silhouettes, scrub and a detailed observatory with mullions, cedar louvres, roof seams, glazed skylight, coping, benches, railing and instruments.
- `public/world/v1/`: content-hashed GLB and an original locally captured WebP still; [asset ledger and exact inventory](../docs/world-assets/README.md).
- `scripts/world/verify-browser.mjs`: reproducible CDP verification using the installed Taste Skill browser helper, no extra browser dependency installed.

Camera: Overview `(−108,82,240)→(0,14,−2)` and Observatory `(−36,46,65)→(0,26,−8)`, fixed 40° perspective/zero roll. A 1.6-second eased southern-water approach starts at the current pose, with a modest vertical bow. Stop retains the actual pose; latest intent replaces travel; return uses the same stable overview. No startup movement, URL/history update, provider request or canvas replacement. Layout effects own cancellation gates; elapsed wall time owns duration. Reduced motion settles instantly. The minimal prototype reserves its own left rail; it does **not** claim the later complete rail/ledger/right-sheet C03/C04 composition is solved.

## Verification and artifacts

Environment: macOS **26.5.2 (25F84)**, **Mac16,8 / Apple M4 Pro / 24 GiB**, headless **Chrome 156.0.8078.80**, ANGLE Metal Apple M4 Pro. Node **26.13.0**, npm **11.20.0**, Vite **6.4.3**, Vitest **4.1.10**; React/DOM **19.2.8**. Physical display refresh, power mode and thermal conditions were not certified. This is neither reference A nor B. Verification baseline: `6e42744` plus this working diff; this task created no commit.

| Check | Actual result |
| --- | --- |
| `npm run test` | **38 files / 221 tests pass**; includes six new navigation/asset/boundary cases. Existing Node experimental localStorage warnings remain. |
| Guard mutation | Removing the intent-ID settlement guard fails the new stale-completion test; restored and passing. |
| `npm run lint` | **Pass, zero warnings** |
| `npm run typecheck` | **Pass**, strict TypeScript / `skipLibCheck:false` preserved |
| `npm run build` | **Pass**; normal main gzip 134,369 B; only main/settings JS emitted, no prototype JS |
| Explicit preview builds | **Pass** at `/ambient-brief/` and `/island-study/`; GLB and fallback URLs resolve under each base. Development `/` also exercised. |
| Incumbent browser smoke | Ordinary production with `?world=observatory` still shows the dashboard; Preferences opens; zero Canvas/world requests. External providers were blocked for this preservation smoke. |
| Browser matrix | **23 scenarios pass** across actual native mouse/keyboard inputs, Tab/Enter/Space/Escape, focus settlement, Stop/Continue/retarget, persistent Canvas, still/OS/saved reduced/Static policies, simulated visibility, 20 actual context losses/retries, three reflow sizes, absent WebGL2, blocked model/chunk/image, thrown GL draw, stalled asset deadline and retry. |
| Renderer idle | No recurring rendered frames over sampled 1.2–1.6-second reduced/still/hidden windows. Show does not resume interrupted travel. These short samples are not the ten-minute/8-hour protocols. |
| Art/HTML review | Actual overview/focus captures inspected at all four desktop sizes; no page scroll/rail-footer overlap, primary controls ≥44px; DPR2 and raster caps checked. Reflow 768/390/320 has no horizontal page overflow. |
| Mechanical design check | Impeccable detector returned `[]`; Taste guidance informed the protected reading plane, clock hierarchy and no-card-grid treatment. Pinned DESIGN typography/palette override generic skill lotteries. |

Authoritative browser output: [browser-results.json](../docs/screenshots/living-world-first-slice/browser-results.json). The final deadline/performance stage resumed after correcting a readiness poll that queried before the lazy HTML shell existed; earlier passed cases were retained. All listed cases actually ran. The final follow-up only adds the clock's accessible seconds label and does not change the captured visual layout.

Captured screenshots (CSS sizes; desktop captures use device scale 2):

| CSS viewport | Opening shot | Focused observatory |
| --- | --- | --- |
| 1366×768 | [Overview](../docs/screenshots/living-world-first-slice/overview-1366.png) | [Observatory](../docs/screenshots/living-world-first-slice/observatory-1366.png) |
| 1440×900 | [Overview](../docs/screenshots/living-world-first-slice/overview-1440.png) | [Observatory](../docs/screenshots/living-world-first-slice/observatory-1440.png) |
| 1920×1080 | [Overview](../docs/screenshots/living-world-first-slice/overview-1920.png) | [Observatory](../docs/screenshots/living-world-first-slice/observatory-1920.png) |
| 3440×1440 | [Overview](../docs/screenshots/living-world-first-slice/overview-3440.png) | [Observatory](../docs/screenshots/living-world-first-slice/observatory-3440.png) |

[No WebGL](../docs/screenshots/living-world-first-slice/no-webgl.png), [failed asset](../docs/screenshots/living-world-first-slice/asset-failure.png), [failed chunk](../docs/screenshots/living-world-first-slice/chunk-failure.png), [image+world failure / DOM](../docs/screenshots/living-world-first-slice/dom-fallback.png), [390px reflow](../docs/screenshots/living-world-first-slice/reflow-390.png), [incumbent production dashboard](../docs/screenshots/living-world-first-slice/production-dashboard.png). All are actual application captures, not concept art.

## Preliminary performance against provisional budgets

Production preview, five cold runs with browser cache disabled, **20 Mbit/s down / 5 up / 100 ms latency**, at 1920×1080. Frame sample: 5-second local warmup then **454 actually rendered frames over 14.949 seconds**, 3440×1440 / DPR2 display emulation. Renderer wrapper samples completed render calls, rather than counting RAF callbacks. Full reference protocol (two-minute warmup/three 60-second segments on A/B) remains unrun.

| Metric | Actual local result | Provisional bound / interpretation |
| --- | --- | --- |
| Shell ready, five runs | 620.2, 622.6, 623.4, 622.8, 632.5 ms; **p75 623.4 ms** | ≤2.5 s, local result fits |
| Complete island, five runs | 1995.6, 2024.5, 2009.1, 2003.0, 2005.5 ms; **p75 2009.1 ms** | ≤6 s, local result fits |
| LCP / CLS | LCP 636–652 ms (p75 644); **CLS 0** in all five | ≤2.5 s / ≤0.1, local result fits |
| Rendered frame rate | **30.30 FPS**, p95 **34.8 ms**, p99 **35.3 ms** | ≥30 / ≤40 / ≤66 ms, preliminary local sample fits |
| CPU command submission | Mean **0.40 ms**, p95 **0.70 ms** per rendered frame | ≤3 ms scripting goal; this is not GPU elapsed time or whole-tab CPU |
| Calls / triangles | Steady **34 / 66,756**; startup with shadows **62 / 106,012** | ≤200 / ≤250k, measured local peak fits |
| Raster | Largest **3456×1446 = 4,997,376 px**, effective DPR≤1.5 at all four sizes; MSAA off | ≤5M px, fits; initial DPR is capped before allocation too |
| JS gzip | Normal eager **131.22 KiB**; final optional renderer+shell+shared icon **265.85 KiB** | ≤200 / ≤700 KiB; optional renderer itself 261.67 KiB, below proposed 550 KiB per chunk |
| Network resources | **2,493,653 B** per cold run, including app/world JS/CSS/model/still and response-overhead estimates; all same-origin | Below 8 MiB initial-world ceiling even with shell included; document navigation bytes excluded |
| Model / fallback | **1.925 MiB GLB**, **44.32 KiB still**, zero asset textures | ≤2 MiB GLB / ≤350 KiB still; source/hash/rights in ledger |
| Resources after retry | All 20 low-tier retries: **34 geometries / 1 texture**, constant counts | No observed count growth; not a driver-VRAM/heap leak proof |

Resource sizing: authored buffers 1,987,584 B, runtime sea/sky approximately 0.5 MiB, no decoded image textures in the model. A conservative allocation estimate including ≤5M RGBA/depth pixels and three 1024² shadow-related texture/depth allocations is approximately **65 MiB**, below the 128 MiB planning cap. This is an estimate of tracked allocations, **not** a hardware VRAM measurement. Exact driver allocations, GPU timer queries, OS CPU/working set, thermal/power and retained heap were not measured.

Raw [performance summary](../docs/screenshots/living-world-first-slice/performance-summary.json), [startup resource peak](../docs/screenshots/living-world-first-slice/startup-resources.json), [preservation/subpath evidence](../docs/screenshots/living-world-first-slice/preservation-and-subpaths.json). Vite warns about the 990.85 kB uncompressed optional chunk; its measured gzip is within the approved provisional allocation. No warning threshold was weakened.

## Finish assessment and remaining gates

The observatory's proportioned canopy, skylight, mullions, cedar screen, stepped arrival and shared coastal palette establish the intended production visual identity. The composed limestone coast/cove, grouped pines, restrained sea/haze and clock-first HTML read as one place. They are original authored assets, not default tutorial buildings or random runtime props. The overview remains fixed while reading; the exterior approach retains coastline continuity.

Still temporary: simplified vertex-painted grass/stone and pine foliage, baked glazing/reflection colors, one fixed illustrative daylight grade, system/Georgia font fallbacks and a minimal art-study overlay. No live weather, other landmarks, full dashboard rail/ledger, complete Journey/Ambient modes, final texture atlases/LODs or weather/night variants are claimed. An artist/owner finish review should refine foliage silhouette and near-view material richness before production acceptance.

Unverified release conditions: reference A/B performance, Firefox/Safari and physical mobile coverage; VoiceOver/NVDA, forced-colors/200% zoom and formal contrast sampling; strict timestamped input/Stop/reduction/failure latency gates; ten-minute idle and eight-hour soak, real OS sleep/resume, GPU/heap/power/thermal profiling, shader-failure injection, Khronos glTF Validator (not installed), clean Node22 install. Local binary/hash/embedded-resource checks and actual GLTFLoader rendering passed; those are not an official validator report. Installation reported 18 dependency advisories; no automatic dependency fix or unrelated upgrade was applied or triaged in this slice.

The complete Living World P0/P1 acceptance and final subjective art approval remain open. No production default, data pipeline, secret, authentication or provider behavior changed; no commit or deployment was performed.
