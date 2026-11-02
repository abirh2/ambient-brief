# Living World — world and art direction

Status: **draft for visual review**, v0.1, 2026-11-02. Companion to [DESIGN.md](../DESIGN.md), [camera/motion](05-camera-and-motion.md) and [visual acceptance](../docs/visual-acceptance-checklist.md). The user confirmed the temperate Atlantic direction; detailed dimensions, asset targets and art execution below await visual approval. This is the `world-presentation` visual specification, not an architecture decision or implementation plan.

## Objective, scope and preservation

Make a single authored coastal island recognizable from its overview and each focused station. Support glanceable HTML without disguising stale data as environmental truth. Trace to PV-01–PV-06, FR-01–FR-16, EN-01–EN-04, IN-04/IN-09/IN-10 and PF-01–PF-06 in [00](00-product-vision.md), [02](02-functional-requirements.md), [06](06-data-and-interactions.md) and [08](08-acceptance-criteria.md). Preserve F01–F16 and address R01–R13 through their existing gates, not changes to providers in this document. [Data contracts](../docs/data-contracts.md) remain unchanged.

Non-goals: choosing Three.js/R3F/another renderer, installing packages, creating a playable simulation, free roaming, reconstructing the user's real geography, adding weather services, trading charts, people/traffic systems or implementing assets/application code. Always/ask-first/never boundaries remain [AGENTS.md](../AGENTS.md). Numeric art allocations are proposed subdivisions of PF budgets, not measured capabilities.

## WA-01 — Island plan and scale

Use meters as an art coordination convention: east +X, up +Y, south +Z, north −Z. Sea level Y=0. Island body spans approximately 180 m east–west and 140 m north–south: X −90…90, Z −65…75. The outline is an asymmetric crescent with an open southwest beach/harbor, a high central ridge and a narrow eastern promontory. It is grounded in ocean; no cutaway floating soil slab, symmetric circular platform or four disconnected islets.

| Feature | Plan center X/Z; ground Y | Approximate footprint / height above ground | Identity |
| --- | --- | --- | --- |
| Central observatory | 0 / −8; 23 m | 30×22 m; 8 m | Oval glass hall under a thin cantilevered bronze canopy, on a 42×34 m stepped stone terrace |
| Eastern lighthouse | 64 / −14; 21 m | 7 m diameter; 27 m including lantern | Tall tapered pale shaft; bronze cap, restrained balcony, attached 12×7×4 m keeper house |
| Western signal station | −59 / −4; 13 m | 18×10 m; 6 m roof, 13 m mast | Low cedar shed with offset shallow roof and one slender signal mast; no giant satellite dish |
| Southern pavilion | 8 / 51; 3 m | 28×16 m; 7 m | Broad shallow folded canopy, open cedar colonnade and stone quay; harbor inlet behind/alongside |
| Southwest beach | −48 / 42; 0–2 m | 38×12 m crescent | Pale sand interrupted by dark wet rock shelves |
| Northern ridge | −10 / −45; 26–30 m | 80×22 m | Low wooded windbreak, never taller in silhouette than lighthouse lantern |

The lighthouse top reaches Y≈48 m, observatory roof Y≈31 m, signal mast Y≈26 m and pavilion Y≈10 m. Height differences must remain apparent in silhouette. No later asset import may rescale a station to compete with the lighthouse without revisiting its shot.

Connect the harbor stair to the observatory terrace; branch west to the signal station and east across the ridge to the lighthouse. Paths 2–2.5 m wide, terrace steps 3–4 m wide, stone retaining walls on steep grades. A partial coastal loop gives depth; never imply an inaccessible gameplay route. At least one continuous path connection must be visible from each focused shot. Paths and terrain do not carry real navigation instructions or claim to be an accessible physical site.

## WA-02 — Composition and silhouette

Use three scales of form: broad cliffs/grass shelves; medium architecture/tree clusters; sparse close-view fittings. The overview must read at 320 px image width before any texture is added: horizontal observatory, vertical lighthouse, mast station, low harbor canopy. For Overview, the four projected landmark silhouettes do not overlap one another; preserve ≥16 CSS px separation at 1366×768, with each principal landmark ≥36 px in its shorter projected dimension (mast excluded). Landmark control names supply meaning when a small silhouette cannot convey its role.

The central ridge descends in two broad terraces toward the south, so the pavilion never hides the observatory. Cliff strata are diagonal/curved slabs, not repeated cuboids. The eastern cliff is sharper and barer than the soft western shore. Keep the observatory's main roof edge unobstructed for ≥80% of its visible length; no tree directly behind the lighthouse cap. Put vegetation in clusters of 3–7 related forms with open grass between; avoid evenly scattered procedural confetti. Use three pine silhouettes and two shrub/grass families, one rock material family, consistent wind lean toward the northeast as an art cue rather than a measured wind vector.

Overview focal order within the world: observatory → lighthouse → path/harbor → signal station. Within the whole screen, HTML clock wins. Reserve sky/sea beneath text; hide no readable data behind foliage. Close shots keep a distant second landmark or recognizable coastline in frame, proving continuity. See CM-01/CM-02 for safe windows and exact shot targets.

## WA-03 — Architecture, materials and finish

| Material family | Base color direction | Proposed physical appearance | Acceptance |
| --- | --- | --- | --- |
| Limestone | Warm pale gray `#BDB9A8`, shadow `#737E7C` | Roughness 0.75–0.95; broad strata; worn bevels at architectural edges | No repeating texture seam at a primary camera; no uniformly flat white cliff |
| Cedar | Weathered gray-brown `#817466`, fresh edges `#AA8863` | Roughness 0.6–0.85; grain subordinate to shape | One shared scale of grain; no shiny orange wood |
| Bronze | Brown-black `#403C35` | Metallic appearance; roughness 0.35–0.6; limited edge wear | No chrome outlines or sparkling noise |
| Observatory glazing | Slate teal `#719294` | Restrained reflection, simplified transmission; interior as broad warm shapes | Roof/frame remains legible from overview; neither black void nor fully invisible building |
| Vegetation | Sage `#768264`, pine `#344F46` | Matte grouped leaf masses; warm tips in sunlight | No photographic cutout palms/cypress mixed with stylized pines |
| Ocean / shallows | Deep `#214D60`, shallows `#4E8388` | Broad low-amplitude undulation, quiet shoreline foam | No mirror sea, high-frequency glitter, tiled edge or data-covering spray |

Values are art targets independent of renderer implementation. Reflections may be baked or simplified; real-time transmission/refraction is not a requirement. Window panes share one material system. Use a few warm interior pools at night, not glowing emissive walls. Instruments are abstract nonnumeric anemometer/mast forms; essential measurements remain in HTML. Lighthouse lantern is a steady warm marker, with no rotating beam sweeping across text and no real navigational claim. No bells or environmental audio required.

**Prototype versus final:** labeled graybox primitives are permitted only for a future private geometry/collision study and never count as WA-02/AC-E01 completion. Final P1 art requires authored silhouettes, softened edges, deliberate UV/material scale, cohesive vegetation, convincing shoreline contact, and complete near/far views. A purchased model with an incompatible style is not final because it has more polygons. Generated concept pixels are inspiration, not a GLB, a licensed third-party kit or a production fallback by default.

## WA-04 — Lighting and atmospheric palette

One broad key direction, cool sky fill and restrained contact shading establish shape. Use soft shadows; keep important architectural planes distinguishable in grayscale. No crushing blacks or clipped white canopy. Tone mapping/grade is world-only: maintain cool sea/shadows and warm lit stone without orange/teal cinema exaggeration. Sky bands and atmospheric perspective are legitimate environmental gradients, not UI decoration.

| Time state | Key / fill / horizon | Visible changes | Visual acceptance |
| --- | --- | --- | --- |
| Morning | Pale peach `#F0CCAA` / blue-gray `#9FB8C1` / pearl `#DDE6E3` | Long soft side shadows, low sea contrast, subtly warm east-facing stone | All four landmarks visible; no sun behind clock glyphs |
| Day | Warm-neutral `#F4EDD8` / sky `#A9CBD5` / pale blue `#C6DDE0` | Shorter shadows, clear grass/stone separation, subdued glass reflections | No blown glazing; no white foam competing with news |
| Golden hour | Straw `#EDB879` / slate `#8099AA` / apricot-gray `#D7BDA2` | Longer shadows, warmer terrace edges, darker blue water | Bronze remains bronze; screen text does not turn orange |
| Twilight | Muted rose-gray `#B3A8AB` / blue `#687E95` / dusky pearl `#AAB6C1` | Key weakens, interior lamps appear, sea darkens | Canopy/cliff outlines remain readable without bloom |
| Night | Moonlike cool `#8196A9` / deep blue `#2C4657` / haze `#526879` | Low steady warm windows, restrained lantern, lighter horizon edge | Architecture recognizable with lights off; no feature visibility depends solely on emission |

Direction of the sun/moonlike key is illustrative, not an azimuth measurement. No moon phase, star chart, astronomical accuracy or new service implied. Light changes cannot signal new forecasts. Use night UI surface tokens to protect text independently of world exposure.

## WA-05 — Time selection, interpolation and availability

EN-01/EN-04 remain authoritative. With valid same-location sun times, use sunrise through sunrise+90 min as morning; then daytime; sunset−60 min through sunset as golden hour; sunset through sunset+45 min as twilight; remainder night. This is decorative art timing, not astronomical twilight. If short daylight makes morning/golden intervals overlap, split daylight at its midpoint and cap each window to half that day's daylight span. If sun times are absent/invalid/polar/uninterpretable, use approximate selected-local-time bands: 05:00–08:00 morning, 08:00–16:00 day, 16:00–18:00 golden, 18:00–19:00 twilight, otherwise night. Expose “Approximate daylight illustration” beside source details; sunset reading itself stays unavailable. Invalid timezone follows DI-02's disclosed fallback.

Continuous clock progression eases lighting through boundary bands, with no camera movement. Accepted weather updates or abrupt clock/location changes blend decorative parameters for **2 seconds**, within EN-04's 1–3-second range, from current visual state; a newer accepted state supersedes that blend. Semantic HTML and provenance change immediately. If previous context becomes invalid, neutralize its weather signal immediately before any blend into a newly accepted context. Reduced motion/Static applies the new still state instantly. UI theme swaps atomically between complete token sets at twilight/morning boundaries; no contrast-breaking mid-color crossfade. No new polling follows these timelines.

## WA-06 — Weather states and honest meaning

Consume only normalized condition groups already supported by the domain. Do not infer rainfall, visibility distance, snow depth, wind direction or AQI from artwork. Selected location drives data, but the Atlantic island never claims to be its literal coastline. Caption: “Illustrated conditions · [domain qualifier]”; full source/time available in the same mode. A weather animation is never labeled Live on its own.

| Group | Sky/light/water/land treatment | Motion-enabled ceiling and fallback |
| --- | --- | --- |
| Clear | Broken small cloud masses, ordinary key/fill, quiet sea | Cloud drift ≤0.5% world-window width per second; no decorative storm/fog |
| Cloudy | Layered cloud shapes, soften key; retain bright intervals as a static composition | Broad slow cloud drift; no flickering moving shadows over text |
| Overcast | Continuous silver ceiling, low contrast sky; warm cedar provides separation | No sun disc; distinct from dark storm; same cloud group if source lacks finer distinction |
| Rain | Gray-blue cloud base, restrained wet stone, dark water | Sparse near-vertical streaks in world safe area; ≤120 visible particles in standard tier; no foreground lens droplets |
| Storm | Darker overhead cloud, cooler fill, modest wave amplitude | Rain ceiling unchanged; no lightning/flashes/shake/audio. NWS alone owns alerts |
| Fog | Soft depth veil behind primary architecture; nearby stone remains readable | No quantified visibility; never obscure required overview silhouettes; no fog pulse |
| Snow | Light cool sky, pale dusting on roofs/grass shelves, exposed paths/rock | ≤80 slow flakes in safe area; no accumulation/depth claim, blizzard wall or clock obstruction |
| Unknown/unavailable/invalid context | Neutral cloud veil, low-contrast sea, time-based light | No precipitation, no “clear” icon/state inferred from neutral artwork; labeled weather unavailable |

Snow appears only when a valid selected-location current condition reports snow; do not guess from month, hemisphere or the fictional coastal biome. Warm regions still use the same island silhouette. Overcast is a tonal variant within the cloud group when normalized information permits, not a new provider field. Forecast probability never triggers current rain. Optional AQI haze is **not selected for v0.1**: weather fog and air-quality measurement would be too easy to confuse. AQI remains category/value/guidance in HTML; unknown AQI cannot gray out the island.

Validated same-context cache within domain validity may retain last-known illustrated weather with visible cached/stale wording. Beyond usable validity or on location change, neutralize it; never invent plausible sunshine. Loaded weather with missing observation time stays conservatively qualified. Demo is development-only and visibly labeled. Partial market/news failures do not change weather. Numeric values never interpolate with lighting.

Station signals are optional subordinate static cues: a small amber observatory entrance panel for a valid official alert; selected topic indicated by a stationary signal-house nameplate highlight; pavilion gains/losses remain HTML, avoiding a whole-building red/green code; lighthouse prayer cue is a steady small doorway lamp only for a valid enabled next prayer, no countdown pulse. The ordinary lighthouse lantern is architectural and does not mean prayer is enabled. Remove expired/old-context alert/prayer cues under IG-01/IG-02; off/unknown domains create no fake activity (EN-03).

## WA-07 — Asset pipeline and quality tiers

Commission/custom-author the island terrain, four landmark exteriors, shoreline and two recognizable hero pine silhouettes. Reusable authored rocks, grasses, shrub clusters, steps, railings and interior shapes may come from one compatible kit after licensing/style review. Use the same scale/bevel/material atlas; do not combine unrelated styles. Decorative boats visible in a concept are optional P2, not launch requirements. No characters, interiors navigable by camera, simulated shipping or elaborate sea-floor assets are required.

Recommended interchange: glTF 2.x / GLB, using the official [Khronos specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html). It defines right-handed coordinates, +Y up and meter distances; material/texture interpretation must follow the specification. These format facts do not choose a runtime. Asset-specific project conventions: origins at local ground contact; island root at sea-level origin; readable names such as `observatory_roof` and `terrain_east_cliff`; consistent scale; separate moving parts and landmark anchors; deterministic exports with no embedded camera animation auto-play. Export only needed geometry/materials, remove authoring helpers, retain editable originals outside runtime payload. Inspect tangents/normals, UV seams, alpha edges and all LOD transitions before delivery. Base-color/emissive textures use their prescribed color interpretation; data maps stay linear. Avoid mandatory extensions until the selected loader/decoder and local subpath behavior are verified.

| Tier | Geometry and materials | Textures/effects | Visual contract |
| --- | --- | --- | --- |
| Standard | ≤180k unique visible scene triangles before effects; reserve remaining PF allowance for passes; ≤140 scene draw calls, total ≤200 | Shared 1K atlases; ≤2K hero atlas; decoded textures ≤64 MiB target; total PF caps still bind | Four authored landmarks, cliff terraces, readable paths, soft contact shadows, broad water/sky |
| Low | ≤90k visible scene triangles; ≤90 scene draw calls | 512–1K atlas variants; ≤32 MiB decoded textures; simple/baked contact shading, ≤40 rain / 24 snow particles, no expensive transmission | Same silhouettes/material family/composition; fewer small rocks, grass clusters and reflections |
| Still / HTML fallback | Zero continuous decorative rendering; still 3D on demand or image/DOM | Locally hosted authored day/night plates; target ≤350 KiB each, ≤700 KiB combined; no animation | Same island identity, full HTML/chapter access, truthful world-status explanation |

These allocations are not additive permission beyond PF-04: ≤250k total rendered triangles, ≤200 total draw calls including effects/passes, ≤96 MiB decoded textures, ≤128 MiB tracked world textures/buffers/targets, DPR≤1.5 and ≤5 million framebuffer pixels. Count extra shadow/effect passes; the scene triangle target may need reduction. Initial world assets/chunks≤8 MiB, total optional world≤16 MiB, optional renderer JS≤700 KiB gzip and eager app JS≤200 KiB gzip remain PF-02. Initial asset allocation target: models 2 MiB, textures 3 MiB, stills 0.7 MiB, with remaining transfer reserved for renderer/decoders/other assets; measure actual network bytes rather than equating gzip JS to wire totals. No 4K texture is required. Landmark low LODs should preserve roof/lantern silhouettes within 2 CSS px of the detailed projection at switch distance; no moving pop in Static.

Reduce, in order: sea detail/reflections → distant grass/rocks → shadow quality → internal resolution → low geometry tier → still fallback. Never reduce typography, source qualifiers, clock cadence, landmark identity or accessible controls. No auto quality preference is persisted. Runtime selection mechanism is DEC-09 technical work. No frame-driven fetch, polling ownership or React-wide frame update is permitted.

Budgets inherit the proposed reference machines in [08](08-acceptance-criteria.md): M1 MacBook Air 8 GB / Chrome+Safari, and ThinkPad X1 Carbon Gen 9 i5-1135G7 Iris Xe 16 GB Windows 11 / Chrome+Edge. Record exact versions and power/thermal conditions; device access is unresolved. Test 1366×768, 1440×900, 1920×1080 and 3440×1440 with PF procedures: ≥30 FPS, p95 frame interval≤40 ms, p99≤66 ms, input p95≤200 ms; HTML LCP≤2.5 s, world-ready≤6 s under specified network; hidden-stop≤1 s, fallback≤1 s after detected failure; 8-hour soak. No budget has been measured for this world.

## WA-08 — Tooling, ownership and delivery gates

Required capabilities, not assumed installations: a 3D authoring/export tool; glTF validation/viewer; mesh/texture optimization; color-managed image export; real-browser rendering and profiling on agreed hardware. Blender is one possible authoring tool, **not detected or assumed available**. Alternatives: an artist supplying reviewed GLBs from their licensed DCC, compatible external authoring software, or commissioned final models. A hand-modeled export path may be selected later; default primitives alone do not meet final art quality. No DCC, optimizer, decoder or frontend package was installed here. The session's built-in image tool was actually available and used for concept references only.

Each production asset requires an ownership ledger before integration: asset ID/version/hash, source URL or commissioned source file, author, acquisition date, exact license/version and saved proof, redistribution/modification permissions, attribution text/location, source-to-export transformations, textures/embedded dependencies, tier sizes, reviewer and approval. Purchased/editorial-only assets must not be assumed redistributable in a public GLB. Record font licenses separately. Obtain project-owner confirmation of rights where unclear; this design is not a legal determination. Host approved assets locally using existing base-path conventions; no hotlinked textures, stock telemetry or new network dependency. Keep source models and final runtime exports traceable; no giant authoring file in the eager bundle.

Fallback art should be rendered from final approved geometry at overview and station crops (or deliberately redrawn with matching silhouettes), with separate day/night grading. A 2D artist can supply this if DCC rendering is unavailable. World failure can use the overview still plus named HTML chapters; no requirement to load six more images before data works. If all image loading fails, use the tokenized neutral DOM surface with the same information. Generated references below are not automatically approved fallback art.

## WA-09 — Concept artifacts, briefs and limits

Two built-in image-generation references were produced and visually inspected on 2026-11-02:

- [Overview concept](../docs/design-references/living-world-overview-concept.png): three-quarter southern coast, four differentiated stations, open ocean at left, pale paths, warm light.
- [Observatory concept](../docs/design-references/weather-observatory-concept.png): oval glazed hall, bronze canopy, terraced approach, eastern lighthouse visible behind.
- [Exact prompts and provenance](../docs/design-references/concept-provenance.json): generator, inputs, role and approval limitations.

These are generated art references, **not application screenshots, geometry measurements or visual acceptance passes**. Review found the images too photographic in rock/foliage/water detail; the focused image adds a distant separation that must not turn the lighthouse into a disconnected island, and does not reserve the specified left rail/right sheet space. Final art must simplify small detail, retain the connected WA-01 plan, and use DS-05/CM-01 safe windows. Do not copy their unverified dimensions, screen layout or atmospheric timing. A visually attractive image cannot prove framerate, HTML contrast or keyboard access.

Precise final shot briefs: Overview uses WA-01's connected crescent with central oval roof and right vertical lantern, three visible path branches and calm left negative sea; island must fit the remaining world lane even with details open. Observatory uses a 20–28° downward exterior view, roof/terrace centrally framed between rail and detail sheet, path entering foreground, lighthouse as a smaller separated background silhouette. Keep the near roof below utility/alert bands and terrace above the ledger. Overcast must soften the key without becoming a storm. See CM-01 for candidate poses and acceptance tolerances.

## Verification and review history

WA-01/WA-02 → VA-01/VA-02/AC-E01; WA-03/WA-04 → VA-02/VA-03; WA-05/WA-06 → VA-06/AC-I01–AC-I03; WA-07/WA-08 → VA-07/VA-08/AC-P01–AC-P06/AC-S02; WA-09 → VA-00. All runtime and final asset gates remain **not run**. Future application verification uses `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, plus rendered/interaction/performance evidence in the checklist; feed generation is not verification. This task records its own baseline commands there.

Alternatives considered: a tropical island weakens the confirmed Atlantic character; a literal instrument/dashboard world adds chrome; photoreal bought kits risk inconsistent art and cost; an all-static world is the complete fallback but does not by itself satisfy the P1 3D launch requirement. Chosen proposal: custom landmark silhouettes plus a tightly shared prop/material kit, quality-tiered within existing PF targets.

Open: asset creator/rights and commissioning budget; exact hardware access/browser floor; renderer/material optimization feasibility; upstream approval record; final art acceptance after geometry exists. No missing answer blocks authoring this draft; these do block claiming production readiness. 2026-11-02: v0.1 authored; detailed art approval pending; no implementation.
