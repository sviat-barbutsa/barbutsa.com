# Personal Atlas

Static Astro site for sviatoslav.dev. The Git/package root is this directory:

```text
D:\web\personal\personal_atlas\website
```

The parent `personal_atlas` directory contains planning and showcase references; production source, tests, lockfile, docs,
and CI live here. It does not contain a second runtime CSS tree or demo page.

## Commands

Use pnpm on Node 24. The local Windows baseline used for this refactor is Node `24.14.0` and pnpm `10.13.1`.

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm check
pnpm test
pnpm test:coverage
pnpm build
pnpm test:e2e
pnpm verify
pnpm release:check
```

`pnpm verify` is the canonical local and CI gate. `pnpm release` runs `pnpm verify` before `wrangler deploy`. Do not use `pnpm release` for dry-run validation; use `pnpm release:check`.

## Content

Articles are Markdown files in `src/content/articles/` with typed frontmatter (`src/content.config.ts`). The schema is
the editorial gate: a missing summary, malformed date, or broken cover image fails the build, not the page.

### Writing an article

```bash
pnpm new:article "Article Title" --category "AI Engineering"
```

This creates `src/content/articles/article-title.md` with valid frontmatter (`draft: true`, today's date) and a
co-located image folder `src/content/articles/article-title/`. It refuses to overwrite an existing article.
`--category` defaults to `General`.

Write in your editor; preview with `pnpm dev`. Drafts are excluded from production output.

### Images

Put article images in the co-located folder and reference them relatively:

```markdown
![Request flow](./article-title/request-flow.svg)
```

Relative references are processed by Astro at build time: raster images are optimized and hashed with
width/height emitted (no layout shift); SVGs pass through untouched. `public/` is served verbatim and is only for
fixed-URL assets (favicons, the default OG image) — never article images.

An optional `cover` frontmatter field (validated `image()`) sets the article's social-share image
(`og:image`/`twitter:image`); without it the site default is used. Source covers should be 1200x630.

### SEO

All SEO output is generated at build time from frontmatter; nothing is authored by hand. `Layout.astro` is the
single head owner and emits per page: title pattern, meta description, canonical URL, Open Graph + Twitter cards,
and JSON-LD (Person + WebSite). Article pages additionally emit `og:type: article`, `article:published_time`,
`article:section`, and a `BlogPosting` JSON-LD node linked to the site's Person entity.

The schema enforces SEO invariants: `summary` (which becomes the meta description) is required and capped at 160
characters so search results never truncate it; a broken `cover` path fails the build. Search operations
(Search Console, indexing, authority strategy) live in `../SEO_PLAN.md`, outside the repo.

### Publishing

```bash
pnpm new:article --retime   # recompute readTime from body word count (200 wpm)
# set draft: false
pnpm release                # runs the full verify gate, then wrangler deploy
```

Every publish passes format, lint, types, unit tests, build, and e2e before deploy. There is no separate content
pipeline; content ships the same way code does.

### Why there is no admin panel

Content is typed Markdown in Git. The editor is the admin panel, the schema is the validation layer, `pnpm release`
is the publish button, and Git is the audit log. A CMS would add a second write path, external dependencies, and an
optional-fields UI that is strictly weaker than a build that refuses invalid content.

If remote editing ever becomes a recurring need, the pre-selected design is a git-backed panel (Sveltia CMS as a
static `/admin` page committing through the GitHub API, deploys triggered by push). It ships as plain static assets,
so it cannot affect public routes. Until that need is real, it stays unbuilt.

## Architecture

- Astro 5 static output; no runtime client framework.
- SVG Atlas is the only active Atlas implementation.
- The generic Canvas engine remains for Flamenco.
- Pause coordination lives in `src/lib/runtime/pause-registry.ts`.
- Visibility/manual pause coordination lives in `src/lib/runtime/activity-gate.ts`.
- Article publication policy lives in `src/lib/content/article-policy.ts`; Astro collection access is isolated in `src/lib/content/articles.ts`.
- Theme state, strategy, and animation math are split under `src/theme`.
- Browser orchestration is tested through Playwright against production preview.

## CSS

`src/styles` is the canonical production CSS tree. `main.css` declares the cascade layer order:

```text
reset → tokens → base → composition → components → utilities
```

Component CSS is split by feature under `src/styles/components/`:

- `core.css`
- `contact.css`
- `theme-toggle.css`
- `site-chrome.css`
- `atlas.css`
- `content.css`
- `home.css`
- `about.css`
- `styleguide.css`
- `terminal.css`
- `xray.css`
- `status-bar.css`
- `flamenco.css`

Shared keyframes live in `src/styles/shared-motion.css`; no feature stylesheet owns motion used by other features. Inline
styles are limited to composition custom-property knobs and values generated by the styleguide.

Cross-document page transitions are not imported in production. `src/styles/page-transitions.css` is a protected,
standalone experiment. Theme-switch view transitions remain active through `theme-motion.css`.

## Tests

Unit tests live only in `tests/unit`. Browser, accessibility, route, interaction, and visual tests live in `tests/e2e`.

Generated output and reports are ignored: `dist`, `.astro`, `coverage`, `playwright-report`, `test-results`, and `blob-report`.
