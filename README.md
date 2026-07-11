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

## TODO before/at first deploy

- [ ] Self-host subset fonts (STACK_PLAN §6.3) — replace the Google Fonts `<link>` in `Layout.astro` with preloaded local woff2 + `size-adjust` fallbacks.
- [x] About-page facts reconciled with the 2026 CV (timeline, metrics, education, independent projects).
- [x] Real URLs extracted from the CV PDF: GitHub (velidan), LinkedIn, StackOverflow, Upwork, and all five external articles (freeCodeCamp/Medium/dev.to) in `src/data/writing-elsewhere.json`.
- [x] GitHub identity: `github.com/sviat-barbutsa` is the canonical account (site + packages). Note: the CV PDF still links `github.com/velidan` — update the CV if sviat-barbutsa is the one to show recruiters.
- [ ] Enable Early Hints + Web Analytics in the Cloudflare dashboard.
- [ ] Flip `labs.json` statuses to `live` as each lab lands on its subdomain.
