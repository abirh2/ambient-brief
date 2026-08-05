# Ambient Brief visual foundation

This foundation supports an ambient display first: cinematic atmosphere, excellent distance readability, and a quiet information hierarchy. Feature components should consume the tokens in `src/lib/styles/tokens.css` instead of adding isolated color, border, radius, blur, or shadow values.

## Palette

The canvas is a deep neutral navy rather than flat black. Time-of-day gradients use blue-gray light for day and night, with desaturated warm light reserved for morning and sunset. Atmospheric effects come from horizon, cool-glow, fog, grain, and vignette tokens.

Text uses five contrast levels: primary, secondary, muted, subtle, and inverse. Informational blue-gray is the normal accent. Green, red, and amber are reserved for their semantic meanings. Purple may appear in exceptional authored imagery or a truly distinct feature, but it is not the default selection or heading color.

## Type scale

The semantic classes are `type-hero-clock`, `type-clock-seconds`, `type-date`, `type-location`, `type-temperature`, `type-section-heading`, `type-featured-headline`, `type-secondary-headline`, `type-body`, `type-metadata`, `type-context-value`, and `type-label`.

The clock and temperature use a numeric stack with tabular lining figures. Apply `numeric`, `tabular-data`, or the appropriate type class to prices, percent changes, prayer times, and other changing numbers. Meaningful desktop copy should be at least the 12px metadata/label size; body copy begins at 14px.

## Surface hierarchy

There are four levels only:

1. Ambient canvas: atmosphere, weather, grain, and vignette.
2. Primary glass: the major weather, news, and market regions. Use `GlassSurface` with the default `primary` variant.
3. Internal tonal section: a quiet grouping within glass. Use `tonal-section`; it has no independent border, blur, or shadow.
4. Compact interactive control: buttons, inputs, and segmented options. Use `compact-control` and `aria-pressed` or `data-selected` for selection.

The `secondary` `GlassSurface` variant is for a top-level overlay such as a drawer or popover, never for a card nested in another glass surface. Decorative clipping belongs to an inner visual layer; do not apply overflow clipping to semantic surface roots.

## Spacing and radius

- Panel padding: `--panel-padding`
- Section separation: `--section-spacing`
- Standard gap: `--gap-standard`
- Compact gap: `--gap-compact`
- Main surface radius: `--radius-surface`
- Compact control radius: `--radius-control`

Use `panel-padding`, `panel-stack`, and `section-rule` where possible. Rows should normally be separated by spacing; a low-contrast rule may separate sections, not every item.

## Interaction states

Hover, active, selected, disabled, loading, error, and focus-visible are centralized. Interactive elements must retain a visible two-pixel blue-gray focus outline with offset. Selection uses a low-saturation blue-gray tone and must also be expressed through state or text, not color alone. Disabled controls reduce opacity and retain their shape. Loading and error states use tonal fills rather than introducing another bordered card.

Reduced motion collapses decorative animation and transitions. Hover motion is limited to a one-pixel active translation on compact controls.

## Anti-patterns

- Purple as a universal heading, focus, or selected-state color
- Uppercase micro-headings with wide tracking
- Text below 12px for meaningful information
- Glass nested inside glass, or a shadowed card inside a glass panel
- A background and border on every row
- Identical pills for categories, statuses, metadata, and actions
- Decorative icons that repeat the adjacent heading without adding meaning
- Thin borders used as the primary grouping mechanism
- Arbitrary highlighted rows without a semantic selected, warning, or error state
- New hard-coded navy fills, radii, shadows, or blur values in feature components
- Hiding overflow at multiple ancestors or removing all scroll affordances
