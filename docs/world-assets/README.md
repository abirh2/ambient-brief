# Observatory prototype asset ledger

Approval scope: product owner's 2026-11-02 chat request authorizes bespoke assets for the isolated Living World slice. Visual acceptance by the owner remains a review step. No third-party models, texture packs, remote HDRIs, stock art or new font binaries are included.

| Asset | Source / creator | Rights / transformations |
| --- | --- | --- |
| Atlantic observatory island v1 GLB | Original model authored by Codex for this repository, 2026-11-02; editable [recipe](../../scripts/world/author-island.mjs) | Repository [MIT license](../../LICENSE), copyright Abir Hossain / Ambient Brief contributors. Original geometry and vertex colors; no acquired embedded content. Redistribution and modification follow MIT. |
| Overview fallback | Browser-rendered capture of this same original geometry and local shaders | Same project MIT terms. Capture and compression recorded in the slice report; no concept-generation image reused. |
| Ocean / sky shaders | Original [Atmosphere.tsx](../../src/features/living-world/renderer/Atmosphere.tsx) | Project MIT. No texture or network dependency; bounded analytic water and atmosphere. |
| HTML icons | Existing `lucide-react` dependency | Existing upstream ISC license in package; no new icon acquisition. |
| Typography | System sans and Georgia fallback stack from DS-02 | No redistributed font file. Final IBM Plex/Newsreader binaries and license review remain deferred. |

Exact asset/source hashes, export bytes, mesh/material names, triangle and geometry-byte inventory: [island-inventory.json](island-inventory.json). Model convention: +Y up, +X east, +Z south, sea Y=0, meters; one central observatory, no other station. The source is the editable model rather than a Blender file. Seeded details are generated **offline** into a checked-in GLB; runtime loads a fixed authored composition.

Rebuild: `node scripts/world/author-island.mjs`, using exact Three 0.187.0 and its GLTFExporter/BufferGeometryUtils. No tool installation, compression/decoder extension, external buffer, image or worker is required. Merging by semantic root/material and welding pine/shrub vertices reduce size and calls. The structural test verifies binary version/length/hash, embedded buffers, absence of external images/extensions and provisional geometry budgets. Browser GLTFLoader decode/render verification is separate. A Khronos-validator report is not implied by that structural test; record any unavailable validation explicitly.

The reference concept PNGs in `docs/design-references` remain design inputs only. They are neither runtime assets nor evidence that this geometry passed review. All generated/runtime files here are available for project-owner review; this ledger records authorship/provenance, not a legal opinion about generated-work copyright.

Fallback export: Chrome 156.0.8078.80 captured the final geometry at 1920×1080 with HTML hidden; `cwebp -q 86` converted that PNG to `public/world/v1/overview.webp` (45,382 bytes; SHA-256 `a4161690cd9e4f028f5d59584070d32c727ecfea318a0da83287090bd646be8d`). It is the same fixed illustrative daylight as this prototype, not a night/weather asset or a generated concept image.
