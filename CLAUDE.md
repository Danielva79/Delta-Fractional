# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Delta Fractional is a static HTML portfolio/services website for Daniel Villegas, a Fractional CFO and financial advisor. It is hosted on GitHub Pages at `deltafractional.com` (configured via `CNAME`). There is no build step — changes go live by committing and pushing to `main`.

## Deployment

```bash
git add index.html index-en.html   # (or whichever files changed)
git commit -m "..."
git push origin main               # GitHub Pages auto-deploys on push
```

There are no build tools, package managers, linters, or tests.

## File Structure

The entire site is two self-contained HTML files:

| File | Language | Status |
|------|----------|--------|
| `index.html` | Spanish | Primary / canonical version |
| `index-en.html` | English | Translation of `index.html` |

All CSS lives in a `<style>` block inside each file's `<head>`. All JavaScript is a single inline `<script>` at the bottom of `<body>`. There are no external JS or CSS files — only Google Fonts loaded via `<link>`.

## Architecture

### Page sections (same in both files, by anchor ID)
- `#hero` — Full-viewport split grid (copy left, floating card right); right panel hidden on mobile
- `#about` — Dark charcoal background; 2-column grid (bio left, expertise grid right); uses `.fade-up` animation
- `#services` — Cream background; auto-fill CSS grid of 9 `.service-card` components
- `#clients` — 8 placeholder `.client-slot` tiles awaiting real logos
- `#approach` — 2-column grid; numbered step list uses `.fade-up`
- `#cta` — Dark charcoal; grid-pattern background via `background-image` linear gradients
- `footer` — `#1E252F` background; flex row with brand, copyright, links

### CSS design tokens (`:root` in both files)
```
--charcoal: #2C3440      --charcoal-mid: #3D4A5C
--orange: #E8841A        --orange-light: #F4A340
--cream: #F8F5F0         --white: #FFFFFF
--text-body: #4A5568     --text-muted: #8A97A8
--border: rgba(44,52,64,0.1)
```
`index-en.html` also declares `--gold-line: #D4A853` (currently unused).

### Typography
- Headings / branding / stats: Cormorant Garamond (serif), weights 300/400/500/600
- Body / UI: DM Sans (sans-serif), weights 300/400/500
- Both loaded from Google Fonts via `<link rel="preconnect">` + `<link href="...">` pair

### Responsive breakpoint
- `index.html`: `@media (max-width: 960px)` — collapses all multi-column grids to single column, hides nav and `.hero-right`
- `index-en.html`: `@media (max-width: 900px)` — same behavior, slightly narrower threshold

### JavaScript (identical in both files, ~10 lines)
1. Scroll listener — toggles `.scrolled` class on `#mainHeader` at `scrollY > 20` (adds `box-shadow`)
2. `IntersectionObserver` — adds `.visible` to any `.fade-up` element when 12% in viewport

### Known inconsistency
`index-en.html` line ~720 has `flex-wrap: gap;` in the footer rule — this is a typo, should be `flex-wrap: wrap;`.

## Content Conventions

- **Language toggle**: `.lang-switch` in the header links `index.html ↔ index-en.html`. The active language gets class `.active` on its `<a>`.
- **Contact links**: LinkedIn profile and WhatsApp (`wa.me/573102216863`) appear in the hero, CTA section, and footer. Both files must be updated together when these change.
- **Client logos**: The `#clients` grid contains 8 placeholder `.client-slot` tiles. Replace the inner SVG + text with `<img>` tags when real logos are available.
- **Bilingual parity**: Both files share identical HTML structure and CSS. Any layout or style change must be mirrored in both files. Content changes are translated independently.
- **Inline SVG logo**: The Delta mark (orange triangle + dark chevrons) is duplicated verbatim in both the header and footer of each file — keep all four copies in sync if the logo changes.
