# Writing and publishing articles

_Reminder for anyone (including future me) on how articles get written and shipped here._

Articles are Markdown files in `src/content/articles/` with typed frontmatter (`src/content.config.ts`). The schema is
the gate: a missing summary, malformed date, or broken cover image fails the build.

## New article

```bash
pnpm new:article "Article Title" --category "AI Engineering"
```

This creates `src/content/articles/article-title.md` with valid frontmatter (`draft: true`, today's date) and a
co-located image folder `src/content/articles/article-title/`. It refuses to overwrite an existing article.
`--category` defaults to `General`.

Write in your editor; preview with `pnpm dev`. Drafts are excluded from production output.

## Images

Put article images in the co-located folder and reference them relatively:

```markdown
![Request flow](./article-title/request-flow.svg)
```

Relative references are processed by Astro at build time: raster images are optimized and hashed with
width/height emitted (no layout shift); SVGs pass through untouched. `public/` is served verbatim and is only for
fixed-URL assets (favicons, the default OG image) - never article images.

An optional `cover` frontmatter field (validated `image()`) sets the article's social-share image
(`og:image`/`twitter:image`); without it the site default is used. Source covers should be 1200x630.

## SEO

All SEO output is generated at build time from frontmatter; nothing is authored by hand. `Layout.astro` is the
single head owner and emits per page: title pattern, meta description, canonical URL, Open Graph + Twitter cards,
and JSON-LD (Person + WebSite). Article pages additionally emit `og:type: article`, `article:published_time`,
`article:section`, and a `BlogPosting` JSON-LD node linked to the site's Person entity.

The schema enforces the SEO invariants: `summary` (which becomes the meta description) is required and capped at
160 characters so search results never truncate it; a broken `cover` path fails the build. Search operations
(Search Console, indexing) are handled outside the repo.

## Publishing

```bash
pnpm new:article --retime   # recompute readTime from body word count (200 wpm)
# set draft: false
pnpm release                # runs the full verify gate, then wrangler deploy
```

Every publish passes format, lint, types, unit tests, build, and e2e before deploy. There is no separate content
pipeline; content ships the same way code does.
