# Stickysection Component

This repository uses `stickysection-*` as the shared component language for editorial sections that combine:

- a headline block
- a short lead/perex
- a set of 1 to N content cards
- optional desktop-only scroll-driven motion

## Purpose

`stickysection` is not a one-off section style. It is the base pattern for sections that should feel structured, readable, and reusable across multiple landing page slices.

## Naming

Use only these generic names for the component:

- `stickysection`
- `stickysection--soft`
- `stickysection--dark`
- `stickysection--paper`
- `stickysection--cards-2`
- `stickysection--cards-3`
- `stickysection--cards-4`
- `stickysection--tall`
- `stickysection-scene`
- `stickysection-pin`
- `stickysection-head`
- `stickysection-grid`
- `stickysection-card`

Do not introduce section-specific layout classes such as `audience-*`, `prokoho-*`, `benefits-*`, etc. Content-specific classes are allowed only for data or semantics outside the component layout system.

## Layout Model

The component has 3 layout modes:

1. Desktop sticky mode: `min-width: 1280px`
   The head and cards live inside `stickysection-pin`.
   `stickysection-pin` is sticky.
   Cards animate from below based on scroll progress.

2. Two-column static mode: `768px` to `1279px`
   The head stays in two columns.
   Headline stays left.
   Perex stays right.
   Cards become a 2-column grid with the last card spanning full width when useful.
   No sticky behavior and no card transforms.

3. Single-column static mode: `max-width: 767px`
   The head becomes a vertical stack.
   Perex drops below the headline.
   Decorative vertical lead rule is removed.
   Cards become a 1-column stack.

## Metrics

These values should be treated as the baseline and adjusted centrally, not ad hoc per section:

- desktop scene runway:
  `stickysection--cards-2`: `calc((min(100svh, 760px) - 112px) + 560px)`
  `stickysection--cards-3`: `calc((min(100svh, 760px) - 112px) + 700px)`
  `stickysection--cards-4`: `calc((min(100svh, 760px) - 112px) + 860px)`
- desktop pin top offset: `112px`
- desktop pin min height: `calc(100svh - 112px)`
- desktop card gap: `24px`
- desktop card min/max height: `320px`
- tall card min/max height: `420px`
- desktop card padding: `34px 32px 30px`
- tablet card gap: `24px`
- tablet card padding: `28px 26px 26px`
- tall tablet card min height: `340px`
- mobile card padding: `26px 22px 24px`
- lead rule width: `2px`
- default lead copy width:
  desktop sticky: `42ch`
  two-column static: `42ch`
  narrower two-column: `100%`

## Typography

- `stickysection-head h2` is the dominant headline.
- `stickysection-head .copy` is a lead, not body copy.
- In two-column and desktop sticky modes, the lead may use a left rule.
- In single-column mode, the lead should lose the left rule and sit naturally under the headline.
- Card headlines should use full available width unless there is a strong editorial reason not to.

## Motion

Motion belongs only to desktop sticky mode.

- Use CSS custom properties on cards for motion:
  `--stickysection-card-y`
  `--stickysection-card-scale`
  `--stickysection-card-opacity`
- JS should target generic data hooks only:
  `data-stickysection-scene`
  `data-stickysection-card`
- When sticky mode is disabled, JS must remove custom properties and leave cards fully visible.
- In sticky desktop mode, shorter content may be vertically balanced inside the pin via shared pin height and symmetric block padding, not section-specific offsets.

## Variants

Color and mood should be expressed through component variables on the root `stickysection` block, for example:

- `--stickysection-bg`
- `--stickysection-accent`
- `--stickysection-card-border`
- `--stickysection-card-copy`
- `--stickysection-lead-rule`

Visual themes should be implemented as modifiers like `stickysection--soft`, not as new layout classes.

## Guardrails

- Do not fix individual breakpoints with one-off selectors before checking the component model.
- Do not duplicate headline/perex markup for different breakpoints.
- Do not mix layout naming with section naming.
- Do not add new breakpoint behavior unless it fits one of the 3 official modes above.
