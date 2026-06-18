# Adaptivio Web

This repository is a small Jekyll site for the Adaptivio web and landing pages.

Keep this file short and repo-specific. Prefer pointing agents to the real source of truth in the codebase instead of duplicating long component documentation here.

## Project Shape

- Jekyll structure:
  - `_layouts/` for page layouts
  - `_includes/` for shared partials and components
  - `_data/` for YAML-driven page content and design-system metadata
  - `assets/css/landing.css`, `assets/css/thank-you.css`, and `assets/css/system.css` as page-family styling entrypoints
  - `assets/css/site/` for included shared CSS partials
  - `assets/js/site.js` for shared client behavior
- Primary landing pages are data-driven.
- The current landing flow is routed through `_layouts/landing.html` and reads content from `_data/<key>.yml`.
- Example page entry:
  - `landing/leadership-camp-founders/index.html`
  - `_data/leadership_camp_founders.yml`

## Component Model

- Reusable sections live in `_includes/components/`.
- Current shared landing components include:
  - `hero`
  - `stats`
  - `stickysection`
  - `timeline`
  - `quote`
  - `people`
- When extending a landing page, prefer composing existing includes before creating a new section type.
- If a new section type is truly needed, update both the relevant include and the section switch in `_layouts/landing.html`.

## Design System

- This repo already contains a design-system dataset and preview page:
  - `_data/design_system.yml`
  - `system/index.html`
- Treat those files, together with CSS entrypoints and included partials in `assets/css/site/`, as the source of truth for tokens, patterns, and current UI rules.
- Do not restate large chunks of design-system documentation in `AGENTS.md`. Keep only the smallest set of rules agents need to work safely.

## Stickysection Guardrails

`stickysection` is a shared editorial section pattern, not a one-off section.

- Use the generic `stickysection-*` naming system already present in the repo.
- Do not invent section-specific layout class families when the shared stickysection model can be reused.
- Keep sticky motion desktop-only.
- Preserve the generic JS hooks:
  - `data-stickysection-scene`
  - `data-stickysection-card`
- If changing stickysection behavior, update HTML, CSS, JS, and design-system docs together.

For current stickysection details, inspect:

- `_includes/components/stickysection.html`
- `_includes/components/sticky-shell.html`
- `assets/css/landing.css`
- `assets/css/site/`
- `assets/js/site.js`
- `_data/design_system.yml`

## Working Rules For Agents

- Prefer minimal, surgical changes over broad rewrites.
- Preserve the existing visual language unless the task explicitly asks for redesign.
- Keep content structure data-driven when a page already uses YAML-backed sections.
- Before adding a new class, check whether an existing component, modifier, or token already solves the problem.
- Avoid duplicating markup for different breakpoints.
- Avoid hardcoding one-off responsive fixes before checking the shared component model.

## Build Notes

- Jekyll build script: `scripts/build.sh`
- Local deploy helper: `scripts/deploy-local.sh`
- Ruby/Jekyll environment is expected; the build script already handles `rbenv`, `bundle`, and direct `jekyll` fallback.
