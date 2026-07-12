# Personal Atlas — sviatoslav.dev

The Edge Atlas site. Static Astro, six-layer plain-CSS system, zero framework JS on every page — the only client code is the ~6KB canvas atlas, a ~4KB theme controller, and the browser doing the rest.

Docs live one level up: `../CSS_ARCHITECTURE.md` (styling contract), `../docs and showcases/stack/STACK_PLAN.md` (architecture decision record), `../docs and showcases/css/theme-switch-showcases/FLUID_RADIAL_IMPLEMENTATION_PLAN.md` (+ Atlas addendum, theme switch).

## Commands

```sh
pnpm install
pnpm dev        # local dev at :4321
pnpm build      # static build → dist/
pnpm test       # vitest (atlas math)
pnpm check      # astro type check
pnpm release    # build + wrangler deploy (Workers static assets)
```

## Map

```
src/
├── styles/            six cascade layers (see CSS_ARCHITECTURE.md) + theme-motion
├── layouts/Layout.astro   head (theme bootstrap, speculation rules), header, footer
├── components/        AtlasHero, ThemeToggle, ArticleList, Pager
├── lib/canvas-engine/ generic Canvas2D lifecycle (~2KB): RAF, pause offscreen,
│                      DPR, reduced-motion, token theming, registry
├── lib/atlas/         the hero scene: config (data), math (pure, tested),
│                      entities (nodes/links/pulse), index (public API)
├── theme/             theme-controller.ts — fluid → radial → instant
├── content/articles/  Markdown, typed frontmatter; build fails on bad data
├── data/              labs.json, packages.json, case-studies.json, site.ts
└── pages/             index, lab, packages, articles (+ /page/N pagination,
                       [slug]), architecture, about, contact, 404, styleguide,
                       rss.xml
```

## Deliberate choices

- **No client framework.** Labs and package demos live on their own subdomains/pages (STACK_PLAN §2.3/§5); this site links out.
- **Pagination** is prebuilt static pages (`/articles`, `/articles/page/2`, …), `PAGE_SIZE` in `src/data/pagination.ts`.
- **Speculation Rules** prerender internal links on intent; external links carry `data-no-prerender`.
- **Cross-document View Transitions** handle page morphs; the theme switch scopes its own snapshot rules via `html[data-theme-motion]` — never remove that gate.
- **Both themes** come from `light-dark()` tokens; the toggle flips one attribute.

## The instruments

Interactive features, all following the same contracts: no ambient animation added (the atlas stays the only self-moving element), token-driven colors (both themes work automatically), graceful degradation (JS off / API missing / reduced motion → static or absent, never broken), and coordination with the theme switch via the pause registry. Full reasoning: `../docs and showcases/features/INSTRUMENTS_PLAN.md`.

### Edge Atlas (homepage hero)
The signature animation: a request pulse finding its nearest edge PoP, with hover/keyboard tooltips per city, hot-node highlighting, and a live readout. Geometry in `AtlasHero.astro`, behavior in `src/lib/atlas/svg-atlas.ts`. Pauses offscreen and when the tab is hidden; reduced motion gets one static routed frame.

### Real telemetry (invisible on localhost — by design)
`src/lib/telemetry.ts` reads two truthful sources: `GET /cdn-cgi/trace` (every Cloudflare-proxied domain exposes it — returns the visitor's actual edge colo; same-origin, nothing stored) and the Performance API (measured TTFB + transfer size of this very page). When deployed behind Cloudflare, the atlas routes to the **visitor's real PoP** (`route: LHR → you · ttfb 38ms · measured`), weights it in the cycle, and rotates the measured line into the readout. On localhost the trace fails inside its 1.5s timeout and the atlas keeps its ambient fiction — that's the fallback working, not a bug.

### Doctrine line + working shell (homepage hero, the `~$` line)
A terminal line that types field-note phrases (`src/data/doctrine.json` — edit freely) with human jitter: type → hold → erase → blink → next. **It's also a real shell**: click it (or focus + Enter), then `help`. Commands navigate (`articles`, `cv`, `contact`…), act (`theme` runs the fluid theme switch, `xray` toggles x-ray mode), or answer by typing into the same line (`ls`, `whoami`). Always exactly one line — a hidden ghost of the longest phrase reserves the height, so nothing ever shifts.
Architecture: `src/lib/typer.ts` (generic typing service) → `Typewriter.astro` (reusable component, any phrases/speeds, multiple per page) → `Doctrine.astro` (this instance + command table) → `src/lib/shell.ts` (input handling).

### X-ray mode (XRAY button in the footer, or shell command `xray`)
The page annotates its own architecture: one `html[data-xray]` attribute switches on outlines identifying every layout primitive (solid signal = `.region`, dashed = `.stack`, dotted = `.cluster`/`.repel`, dashed signal = `.grid`/`.sidebar`) plus a legend panel with live token swatches and the cascade-layer order. Outlines only — they cannot affect layout, so toggling is guaranteed shift-free. Session-scoped. `src/lib/xray.ts`.

### Status bar (bottom edge, desktop ≥768px only)
Editor-style statusline: current section + scroll % on the left; visitor colo + measured ttfb (when telemetry resolves), theme name (live — it watches `data-theme`), and a UTC clock on the right. `StatusBar.astro`; body padding reserves its space so it never covers content. `aria-hidden` — it duplicates information available elsewhere.

## Performance

Audit the **production build**, never the dev server — `astro dev` injects its
dev toolbar (the "duplicated JavaScript" Lighthouse finds at `dev-toolbar/…`,
`audit/…`, `ui-library/…` paths is the toolbar, not the site) and serves
unminified, uncompressed modules. Correct procedure:

```sh
pnpm build && pnpm preview   # then point Lighthouse at the preview URL
```

Baseline on the production build (July 2026): **Performance 98 ·
Accessibility 100 · Best Practices 96 · SEO 100** — FCP 1.5s, LCP 1.7s,
TBT 0ms, CLS 0. Known readings that are fine: Speed Index runs high because
the atlas animates continuously (SI measures ongoing pixel change — that's
the one budgeted animation working); the caret "layout shifts" are 7×13px
with zero CLS impact; cache/compression findings vanish behind Cloudflare.

## TODO before/at first deploy

- [ ] Self-host fonts: run `node scripts/fetch-fonts.mjs` locally (needs open
      internet — downloads woff2 to `public/fonts/`, writes
      `src/styles/fonts.css`, rewrites `Layout.astro` off the Google CDN).
      Kills the one real render-blocking request (~780ms at LH throttling).
- [x] About-page facts reconciled with the 2026 CV (timeline, metrics, education, independent projects).
- [x] Real URLs extracted from the CV PDF: GitHub (velidan), LinkedIn, StackOverflow, Upwork, and all five external articles (freeCodeCamp/Medium/dev.to) in `src/data/writing-elsewhere.json`.
- [x] GitHub identity: `github.com/sviat-barbutsa` is the canonical account (site + packages). Note: the CV PDF still links `github.com/velidan` — update the CV if sviat-barbutsa is the one to show recruiters.
- [ ] Enable Early Hints + Web Analytics in the Cloudflare dashboard.
- [ ] Flip `labs.json` statuses to `live` as each lab lands on its subdomain.
