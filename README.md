# Adaptivio Web

Small Jekyll site for the Adaptivio homepage, landing pages, and design-system preview.

## What Is In This Repo

- `index.html` is the current homepage / holding page.
- `landing/` contains individual landing-page entries.
- `_data/` contains YAML content for landing pages and the design system.
- `_includes/components/` contains reusable landing-page sections.
- `_layouts/landing.html` renders the shared landing-page flow.
- `assets/css/landing.css`, `assets/css/thank-you.css`, and `assets/css/system.css` are page-family styling entrypoints; included partials live in `assets/css/site/`.
- `assets/js/site.js` contains shared client behavior.
- `system/index.html` renders the internal design-system preview.

## Requirements

- Ruby
- Jekyll 4.4
- Bundler

The build script defaults to `RBENV_VERSION=3.3.7` when `rbenv` is available.

## Local Development

Install dependencies:

```bash
bundle install
```

Build the site:

```bash
scripts/build.sh
```

Serve it locally with Jekyll:

```bash
bundle exec jekyll serve
```

Then open:

- `http://127.0.0.1:4000/`
- `http://127.0.0.1:4000/system/`

## How Landing Pages Work

Landing pages are data-driven.

Each landing page typically has:

1. a page entry in `landing/.../index.html`
2. `layout: landing`
3. a `data_key`
4. a matching YAML file in `_data/<key>.yml`

Example:

- `landing/leadership-camp-founders/index.html`
- `_data/leadership_camp_founders.yml`

The shared landing renderer is `_layouts/landing.html`. It reads:

- `meta`
- `brand`
- `hero`
- `intro`
- `sections`
- `final_cta`

Most new landing pages only need:

1. a new `landing/.../index.html`
2. a new `_data/...yml`
3. content composed from existing section types

Current shared section types:

- `stickysection`
- `timeline`
- `quote`
- `people`

If you need a genuinely new section type, add:

1. a new include in `_includes/components/`
2. the corresponding case in `_layouts/landing.html`

## Editing Content

Use `_data/*.yml` for page content changes whenever possible.

Typical edits:

- hero copy, CTA labels, and links
- intro text and metrics
- section order and section content
- speaker / people blocks
- final CTA text
- thank-you page text and metadata

Keep the content structure data-driven instead of hardcoding one-off markup into page files.

## Design System

The source of truth for shared UI patterns is:

- `_data/design_system.yml`
- page-family CSS entrypoints and included partials in `assets/css/site/`
- `assets/js/site.js`

Preview page:

- `/system/`

When changing the shared `stickysection` pattern, update the markup, CSS, JS, and design-system documentation together.

## Deploying A Static Build Locally

To build and copy the generated site into another directory:

```bash
scripts/deploy-local.sh /path/to/target-directory
```

This builds the site and syncs `_site/` into the target path.
