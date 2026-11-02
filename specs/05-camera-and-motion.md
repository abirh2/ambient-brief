# Living World — camera, compositions and motion

Status: **draft for visual review**, v0.1, 2026-11-02. Detailed camera design for `mode-navigation`, dependent on the world/HTML contracts; no rendering framework, camera library or implementation selected. Read [DESIGN.md](../DESIGN.md), [world/art](04-world-and-art-direction.md), [functional requirements](02-functional-requirements.md) and [interaction contracts](06-data-and-interactions.md). Verification is [visual acceptance](../docs/visual-acceptance-checklist.md) and AC-N01–AC-N06/AC-E01 in [08](08-acceptance-criteria.md).

## Objective and invariants

Make four places feel connected through composed, cancelable travel while keeping the daily brief readable. The baseline is PV-01–PV-06, OV-01–OV-04, JY-01–JY-04, AM-01–AM-04, EN-04 and IN-01–IN-10. These identifiers and their existing deadlines are retained. Camera movement does not own data, fetch, reset topic/settings, change history or encode fresh/live status. All F01–F16 remain HTML-accessible. Follow [AGENTS.md](../AGENTS.md) preservation and approval boundaries.

## CM-01 — Shot grammar and camera schedule

The opening establishing shot **is the stable Overview resting pose**. No introductory fly-in, logo hold, camera orbit or compulsory animation. Essential HTML appears while the world loads; once available, the world replaces the still fallback in the same composition. A motion-enabled 180 ms opacity reveal is optional, not a movement; reduced motion uses immediate replacement. Loading/failure does not delay controls. This resolves “establishing shot” with OV-01's explicit no-fly-in rule.

Use restrained perspective, level roll, soft depth through atmospheric perspective rather than depth-of-field blur. No camera bob, shake, dolly zoom or mouse parallax. Candidate coordinates below use WA-01's meter convention (+X east, +Y up, +Z south). They are authoring starting poses, **not collision-tested final engine values**. Screen-space constraints below are the acceptance authority; adjust positions/lens together during approved asset staging without altering navigation behavior. Record final poses and visual evidence before calling them approved.

| Pose | Candidate position → look target | Vertical FOV / downward pitch intent | Framing target in unobscured world lane |
| --- | --- | --- | --- |
| Overview | (−18, 120, 212) → (0, 12, 0) | 40° / about 27° | Whole coastline occupies 82–90% lane width; horizon upper 15–25%; observatory center near (50%,48%) |
| Observatory | (−34, 52, 64) → (0, 26, −8) | 38° / 20–28° | Roof/terrace occupy 55–65% lane width; center (48%,50%); eastern lighthouse smaller in background |
| Lighthouse | (103, 54, 57) → (64, 32, −14) | 36° / 12–20° | Tower uses 60–72% lane height; lantern below top 12%; path and a portion of observatory remain visible |
| Signal station | (−100, 39, 58) → (−59, 17, −4) | 38° / 15–25° | Shed + mast occupy 50–65% lane width; mast top below top 12%; diagonal path toward central ridge |
| Pavilion | (39, 29, 109) → (8, 7, 51) | 40° / 15–23° | Canopy/quay occupy 60–70% lane width; no cropped roof corners; observatory uphill in background |
| Ambient | Same position/target as Overview | Same lens | Same stable silhouette scale; calmer world activity and receding tools supply the distinction |

Percent coordinates are inside the **unobscured world lane**, not the entire monitor. Follow DS-05's boxes; reserve the right detail-sheet zone in every resting composition, even while closed. At 1366×768 the conservative shared lane is x392–934, y88–576; at larger sizes it expands. This sacrifices island size at the smallest desktop to protect OV-02 and fixed-camera local disclosures. Opening an Overview panel does not refit the camera. A resize may fit the same view direction to new safe bounds without an animated trip; if the lane becomes too small, use DS-08 reflow. Full-width scenic screenshots are art references, not this product's readable screen composition.

At Overview rest, lighthouse, roof, mast and pavilion are ≥16 CSS px apart and each principal building's short projected dimension ≥36 px. No required landmark behind text. In focused shots, main subject occupies at least 45% lane width (lighthouse uses height instead), path contact is visible, and another landmark or continuous coastline is identifiable. Limit roll to 0°. Keep roofs/lanterns ≥24 px clear of UI edges. Do not scale buildings to compensate for a poor lens. If all targets cannot coexist, report the failed visual gate and revise the draft before implementation acceptance.

## CM-02 — Six primary screen compositions

All six retain DS-05's clock/weather/news rail and markets/context ledger, including per-value qualifiers. Those regions do not animate during travel. Global utility/mode controls stay in their consistent positions. Details open locally in any mode; a **focused camera composition** is a Journey visit, not the result of opening Overview details. All station panels share the same right-side sheet and local scrolling. Narrow screens use DS-08's sequential HTML composition; no wheel-driven camera there.

### 1. Island Overview

- **Camera/focal subject:** fixed three-quarter southern view, observatory first, lighthouse second, paths connecting west and harbor. Opening/reload uses this resting shot immediately.
- **World/interface:** left rail, bottom ledger, utilities above world; right safe zone remains available for local details. World is continuous behind the reading planes, never divided into four tiles.
- **Primary data:** clock seconds/date/location; current temperature/condition, feels-like/high/low/insight and weather qualifier. **Secondary:** topic controls and featured + two secondary headlines with publisher/age; all three ETF proxies + first company; enabled currency/next prayer/Hijri, AQI/UV/sunset, alert availability and connection/refresh.
- **Controls/navigation:** labeled Overview/Journey/Ambient, four station Details controls, Preferences/Refresh. Landmark click mirrors Details. “Visit in Journey” is separate. Enter Journey starts at overview vantage and waits for user input.
- **Entry/exit:** no clock or rail entrance sequence. Detail sheet may enter 180 ms/8 px and leave 120 ms/4 px; no camera movement. Returning closes details and focuses Overview.
- **Desktop/narrow:** DS-05 exact frame at supported desktops. Narrow reflows the full brief and shows a still island; disclosures are inline.
- **States:** world skeleton/still independent of domain loading; highest valid alert in reserved strip; stale/partial value qualifiers adjacent. Empty/unavailable news preserves its region. No-data startup never renders plausible sample values.
- **Acceptance:** VA-01/VA-02/AC-N01; read all OV-02 summary without travel, scroll or obscured focus at normal supported desktops.

### 2. Weather Observatory

- **Camera/focal subject:** exterior southern terrace approach, oval canopy/glass hall central; lighthouse in background. No interior camera pass through glazing.
- **World/interface:** observatory between persistent left rail and right sheet; bottom ledger remains. Weather details never replace the rail clock or grow a temperature larger than it.
- **Primary detail:** station heading, current condition/temperature/status with feels-like/high/low; deterministic insight, humidity and wind with units. **Secondary:** six hourly rows, Full forecast to eight/Compact view, precipitation threshold labels; AQI pollutant/guidance disclosure; UV/sunset remain existing continuous context. Source/time details distinguish fetch from observation.
- **Controls/navigation:** forecast disclosure, AQI details, existing Retry/global Refresh, location/units through Preferences; Previous/Next/direct stations, Back and Return to Overview. Alert detail/dismiss are explicit HTML actions.
- **Entry/exit:** retain prior settled sheet labeled with its station while moving, plus “Travelling to Observatory”; replace content and focus heading only upon direct settlement. New sheet content fades up to 180 ms without hiding actionable data. Scroll entry keeps focus in exploration region.
- **Desktop/narrow:** fixed right sheet locally scrolls forecast/pollutants; no horizontal carousel required. Narrow puts full weather detail after shared brief/station navigation, forecast as vertical rows.
- **States:** weather cache/age covers hourly/UV/daylight explicitly; null UV/AQI/pollutants stay individually unavailable. Invalid weather means neutral atmosphere, not clear conditions. NWS unavailable/unsupported is different from none.
- **Acceptance:** VA-02/VA-06, AC-F03–AC-F06/AC-F09/AC-F10; detailed weather stays subordinate to clock and cannot claim a measured weather intensity from art.

### 3. Lighthouse / Time and Prayer

- **Camera/focal subject:** eastern tower fully framed from southeast; lantern and terrace path separated from ridge. Static warm lantern, never sweeping beam.
- **World/interface:** vertical subject balances horizontal reading rail; sheet owns time context and optional prayer. Keep clock in the same rail position and size; do not create a competing second giant clock.
- **Primary detail:** local date, timezone and device-clock provenance, existing time-format/location access. **Secondary when enabled:** next prayer/time/minute countdown, requested Hijri, method/school/date/context; expandable six-row schedule if enabled by preference. Past/next use text/weight, not color alone.
- **Controls/navigation:** schedule disclosure, relevant Preferences, source detail, Previous/Next/direct station/Back/Return. Prayer off shows a quiet optional-feature explanation in detail, with no empty schedule space in summary. Lighthouse remains a time landmark.
- **Entry/exit:** shared sheet behavior; no lantern pulse on arrival or prayer countdown. No sound, notification or due-prayer alarm added.
- **Desktop/narrow:** schedule rows fit sheet or local scroll; narrow single column retains date/context near times, not in hover tips.
- **States:** invalid timezone explicitly disclosed; valid cached schedule qualified even with Hijri hidden; missing future prayer says unavailable. No old-date “now,” no sunrise promoted as next prayer, no simulated dawn to conceal data failure.
- **Acceptance:** VA-02/VA-06, AC-F01/AC-F12/AC-I01; prayer-off view still coherent and no request/activity fabricated.

### 4. Signal Station / News

- **Camera/focal subject:** low western cedar house and slender mast, path climbing toward observatory. No broadcasting rings or animation that implies live news.
- **World/interface:** sheet reads as an editorial column, with station outside its bounds. Summary's active topic remains selected; do not create an independent topic state.
- **Primary detail:** selected topic and featured headline with publisher/publication age, description and safe external link. **Secondary:** additional stories, optional image, feed generation/partial/cache qualification. Full content list remains available via existing expansion.
- **Controls/navigation:** topic selection, Customize/Manage, View additional stories/Show less, Retry, external article links, chapter controls. No invented article reader or auto-rotating headline.
- **Entry/exit:** sheet entrance only; topic filtering updates in place without camera activity or focus reorder. Image load uses reserved dimensions, no pushing links while the user reads.
- **Desktop/narrow:** right sheet locally scrolls; news summary stays readable on left. Narrow full-width story list uses wrapped titles and one optional 16:9 image, not a swipe carousel.
- **States:** separate feed-empty, category-empty, stale/delayed, partial and unavailable copy. Failed image becomes a quiet solid image slot or is removed without losing headline/source. Carried category refresh age unknown is explicitly unknown; story publication age is not a new fetch time.
- **Acceptance:** VA-02/VA-06/AC-F07/AC-I03; same-mode access to all selected stories and no unofficial live signal.

### 5. Market Pavilion / Markets and Currency

- **Camera/focal subject:** south harbor quay at low three-quarter elevation, broad cedar canopy, observatory uphill. Keep roof edge and quay contact visible; no graph-shaped architecture.
- **World/interface:** quiet horizontal pavilion opposite aligned data rows in the right sheet. Persistent proxy/company ledger does not vanish.
- **Primary detail:** enabled SPY/DIA/QQQ ETF proxy rows and all selected companies, USD price, signed absolute/percent change, row/source time and stale/missing qualifiers. **Secondary:** estimated session, generated time/last check; enabled currency pair/reference equation/date/source.
- **Controls/navigation:** Check published snapshot, company settings, currency selectors/details in existing Preferences, existing market-cache controls through Data & Privacy; Previous/Next/direct/Back/Return. A check never claims to refresh Finnhub itself.
- **Entry/exit:** values appear directly, no rolling price animation or green/red sweep. Selection/disabled states are neutral; money direction is only a signed data annotation.
- **Desktop/narrow:** right aligned numeric table; wrap proxy labels visibly. At narrow width, each row becomes label/value/qualifier lines rather than horizontal page overflow. Markets off/currency on still shows reference data; both off shows local settings explanation and the physical pavilion.
- **States:** partial rows keep original timestamps, missing quote/change uses unavailable, no zero fill. “Already current published snapshot” differs from new quotes. Unsupported USD/BDT remains unavailable; no cross-rate fabrication or provider migration.
- **Acceptance:** VA-02/VA-06/AC-F08/AC-F11/AC-I03/AC-I04; all company choices accessible without mandatory travel, no history chart invented.

### 6. Ambient View

- **Camera/focal subject:** same stable overview pose, whole connected island. Entering from Journey reframes once; entry from Overview needs no move.
- **World/interface:** same readable rail/ledger, no detailed sheet on entry. After 10 seconds of inactivity and focus outside tools, secondary tools recede. Data, topics/headline links, freshness/connection and visible “Exit Ambient / Controls” remain. No clock-only screensaver.
- **Primary/secondary:** entire OV-02 summary, in exactly the same order and minimum type sizes; enabled modules stay visible. Island is quieter, not a substitute for information.
- **Controls/navigation:** first deliberate link tap works; pointer movement/focus/tap Controls restores tools immediately without exiting. Exit or Escape outside nested UI returns Overview. Station details accessible through restored controls; Visit explicitly enters Journey.
- **Entry/exit:** close detail, settle wide pose within CM-03 bounds, focus Ambient exit. Secondary chrome may fade for 180 ms after timeout; focused controls never fade. Reduced-motion recession changes instantly.
- **Desktop/narrow:** same summary frame on desktop, sequential complete HTML on narrow. No automatic idle entry, mobile fullscreen lock or scroll suppression.
- **States:** offline/stale/partial visible even with tools receded; critical official alert reveals controls and banner, cancels movement but does not exit or steal focus. World failure becomes still/HTML with visible retry.
- **Acceptance:** VA-02/VA-05/VA-06, AC-N04/AC-N05; no lost reading/action during eight-hour use or after control recession.

## CM-03 — Guided path system

Default Journey chapters: **Overview vantage → Observatory → Lighthouse → Signal station → Market pavilion → Return to Overview**. Physical chapter positions/order remain even when optional content is disabled. A direct station visit skips intervening chapters and never queues their panels. “Previous/Next” uses fixed order; “Back” uses previous completed visit, as IN-08 specifies. A canceled trip is not a completed history entry. No URL/router/history state is added.

Travel is a continuous position/orientation path with eased start/end and zero roll. Suggested easing for direct travel: smoothstep `3t²−2t³`, with look target eased over the same duration. Do not overshoot or bounce. Default adjacent visits 1.2 s; direct nonadjacent visits and return 1.6 s; short re-target/mode reframe 0.8 s where a move is needed. All direct travel stays **0.8–1.6 s, hard maximum 2 s** (IN-02); no decorative hold. Scroll release has its separately required ≤500 ms settlement. No fixed duration may justify geometry clipping or a violent turn.

Suggested authoring corridors, refined after real geometry exists:

| Route | Visual path / clear-space control point | Avoid |
| --- | --- | --- |
| Overview ↔ Observatory | Descend from southern water toward terrace, control near (−30,80,125) | Flying through pavilion roof or observatory windows |
| Observatory ↔ Lighthouse | Rise outward over southeastern shoulder, control near (75,65,62) | Cutting through central ridge / scraping lantern |
| Lighthouse ↔ Signal station | Wide southern arc over water, control near (0,90,112) | Straight chord through observatory; 180° whip-pan |
| Signal station ↔ Pavilion | Southwest offshore curve, control near (−70,42,93) | Cliffs, trees, harbor roof |
| Pavilion ↔ Overview | Rise and retreat over southern water, control near (0,75,157) | Reversing through market architecture |

Every pair among the four stations plus Overview must have a reviewed bidirectional corridor (ten unordered pairs), including the five pairs not in the chapter sequence. Use shared clear-water corridors where feasible but do not pass through intervening settled poses or show their panels. Reserve ≥3 m from architectural/terrain collision envelopes and ≥5 m from tree crowns along paths. Also verify screen-space occlusion: a mesh outside collision radius may still cover the focal subject. Sample each path every 5% progress and test continuous runtime. No camera roll; no near-plane geometry; no subject jumping outside safe lane at settlement. If a corridor cannot meet safety, composition and duration simultaneously, revise camera/terrain staging for review; do not silently extend time or disable cancellation.

When retargeted mid-path, cancel the old intent and use the current pose as the new start with a safe corridor. Keep position/orientation continuous and avoid sudden angular-speed spikes; no snap to the old path's starting point. An intermediate stop may require a dedicated egress to clear water before approaching the new station, still within the direct-travel limits. Staging must prove all interrupted poses work; coordinates alone cannot prove this. Repeated nav inputs replace, not append.

## CM-04 — Journey scroll chapters

Only a visibly labeled **Explore the island** region within the world lane owns guided scroll. Include a concise “Scroll here, or use Previous / Next” hint and labeled chapter controls. It is focusable and Tab leaves it. No Overview/Ambient wheel-to-camera handler; no document-wide scroll hijacking. Narrow/fallback/zoom layouts use ordinary document scrolling and direct chapter controls instead.

Proposed gesture scale: 480 CSS px normalized vertical input per adjacent segment; clamp one gesture session to that segment. On release/no input for **200 ms**, settle to the nearer endpoint within **500 ms**, ties toward the input direction. A gesture session ends after that inactivity; residual input cannot queue multiple chapters. Fresh input can start the next segment after settlement or retarget the current segment. Upward input reverses within the same path. Movement maps to path progress, not camera velocity, and has no momentum after settling. Native scrolling keys within the exploration region may advance its progress; buttons remain the complete alternative.

Panels, forecast/news lists, popovers, preferences and dialogs own normal scroll and contain it at both ends. Touch pan starting inside a panel cannot become world navigation. Pinch zoom and text selection remain native. A pan/drag suppresses landmark click on release. Direct navigation, Stop, modal, critical alert, hidden tab, context loss and motion-policy change cancel a pending settle. Scroll-driven settlement announces the chapter once politely but never steals focus. Reduced motion selects a still chapter at the same decision boundary without interpolating the camera.

## CM-05 — Cancellation, input lock and focus

“Input lock” applies only to conflicting **world gesture ownership**; it never disables HTML recovery/navigation while travel is running. Controls acknowledge input immediately; direct heading focus waits for actual settlement. There is one active camera intent and one owner at a time. Use IN-01 as the authoritative logical mode/selected/settled/panel separation.

| Event/state | Camera and input result | Reading/focus/release rule |
| --- | --- | --- |
| Direct nav during motion | Replace intent from current pose; cancel scroll settle | Destination indicator updates immediately; prior settled panel remains explicitly named until new settlement |
| Stop motion | Freeze at current pose within **100 ms** of handling | Keep last settled chapter/content; show Continue to target; no focus theft, no inertia |
| Escape | Apply nested priority: top modal → popover/panel → moving camera → Ambient exit → Journey return | Escape consumed by a panel does not also stop travel; Stop button remains visible while moving |
| Modal/settings/provider/alert details open | Cancel movement/scroll ownership within 100 ms; ignore world pointer/scroll | Focus contained in modal; closing restores invoker, never resumes motion; Continue required |
| Newly valid Severe/Extreme alert | Cancel travel, show official banner and reveal controls | No camera reframe, mode change, focus theft, sound or modal; existing modal stays on top |
| App/OS reduced motion or Static enabled | Cancel animated work within 100 ms; immediately show selected destination still pose | No animated remainder; no completion callback steals modal focus; announce only appropriate settled chapter |
| Tab hidden | Cancel movement; stop decoration within 1 s | Preserve last settled context/held pose; no focus manipulation; visible return does not auto-resume |
| Renderer/chunk/model/context failure | Cancel and enter still/HTML fallback ≤1 s after detection | Retain mode/selection/data; focus surviving station control if current target disappears; explicit Retry world |
| Location/units/pair/method change | No camera movement or camera-driven fetch | Update domain context independently; invalid old-context signals removed immediately |
| Resize/orientation/zoom | Cancel travel; recompute safe still framing or reflow | Keep focus/content; no automatic trip or document scroll; explicit next navigation resumes |

When moving, show “Travelling to [station]” with a **Stop motion** button in the utility/route area, never hidden under a sheet. A held pose shows “Travel stopped · Continue to [station]” and Return to Overview. Keep the last settled content until completion; no mismatched new heading over old values. Direct settlement focuses destination heading once; scroll settlement retains focus and announces once. Outdated completions cannot overwrite a newer destination or steal focus from a modal. Opening a new modal releases world ownership only on close, but release means navigation becomes possible, not automatic replay.

If initial travel is canceled before any station completed, last settled context is Overview vantage. Return to Overview closes station details, clears local visit stack and focuses Overview control; closing a blocking modal comes first. Mode changes do not refetch. Ambient Enter from a held pose replaces that intent with wide framing; Ambient exit returns Overview, never resumes an old Journey.

## CM-06 — Environmental and interface movement

Stationary camera means mathematically constant pose while reading, including hover, seconds ticks, topic changes, refresh, forecast expansion and ordinary weather updates. No idle drift after 10 seconds, 10 minutes or eight hours. Living/Subtle may animate water/cloud/vegetation under WA-06; Subtle uses half amplitude and at least double loop duration. Proposed Living loops: water broad swell 12–20 s, tree branch sway 18–30 s at ≤1.5° (Subtle≤0.75°), sparse cloud drift bounded in WA-06. Loop phases need not synchronize; no whole-island breathing effect. No meaningful measurement maps to those loop speeds.

Environmental data changes blend in 2 s; HTML state changes immediately. Never animate numeric intermediate values. DS-11 UI entry/exit applies to sheets and controls only. No layer crosses text/focus regions. Critical alerts use stable color/text, not pulsation. Foliage/water loops, static-still refresh and resource pacing are implementation questions within PF caps; this document does not select animation libraries.

## CM-07 — Motion-off, low-quality and unavailable world

Effective reduction is OS OR app, with Static equivalent for decoration/travel. All positions update instantly, no camera interpolation, crossfade, parallax, animated hover, shimmer or precipitation. Station selection, content/focus, announcements and chapter order remain equivalent. Re-enabling motion waits for a new deliberate navigation; no suspended trip resumes. A still frame may update when time/data state materially changes; no continuous frame loop is justified for clock text.

Low-quality 3D preserves silhouettes and controlled paths, dropping effects per WA-07. If it cannot meet PF budgets, show a coherent still/HTML treatment with explanation; a static fallback is functional preservation, not a claimed P1 3D pass. Missing assets/no WebGL/context loss keep all summary and details. Journey becomes semantic chapters, Ambient keeps exit and summary. Retry world never resets providers; successful retry restores the selected stable pose immediately, no celebratory fly-in. Hidden/resume recomputes valid time/data and does not replay elapsed motion.

## Acceptance and unresolved decisions

| Requirements | Evidence destination |
| --- | --- |
| CM-01/CM-02, PV-01/PV-02/PV-06, OV-01–OV-04 | VA-01/VA-02, AC-N01, AC-E01: six compositions, desktop sizes, data-state fixtures and measured safe-area bounds |
| CM-03/CM-04, JY-01–JY-04, IN-02/IN-05/IN-08 | VA-05, AC-N02: all pairs, forward/reverse, sampled paths, direct/scroll traces and cancellation |
| CM-05, IN-01–IN-03/IN-06–IN-09 | VA-04/VA-05, AC-N03/AC-N04/AC-N06: keyboard/touch, nested focus, interruptions and no history/provider side effects |
| CM-06/CM-07, AM-01–AM-04, EN-04, IN-04/IN-10 | VA-05/VA-06/VA-07, AC-N05/AC-N06/AC-P05/AC-P06: stillness, reduction, failure and eight-hour behavior |

All runtime checks remain **not run**. Commands for future changed implementation: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`; these supplement, never replace, visual/path/focus traces. No code-style example is needed for this documentation-only task. Existing architecture/data contracts remain authoritative.

Open decisions: final camera poses after approved geometry; complete mid-path egress/collision proof; browser input normalization and compatibility floor; device access; technical implementation and upstream approval record. The safe-lane tradeoff at 1366×768 needs actual visual approval: the world is smaller to preserve continuous information. A larger scene would require a reviewed change to the persistent summary, not a quiet deletion. The generated observatory image is not a verified safe-lane shot. 2026-11-02: draft v0.1, no implementation or motion evaluation claimed.
