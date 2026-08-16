# Personal Atlas

Source of [barbutsa.com](https://barbutsa.com) - my personal site: writing, selected work, a few small tools I keep
online. It is a static Astro 7 site served as Cloudflare Workers static assets. There is no client framework; the
interactive parts (the SVG atlas in the hero, the theme switch, the command line, the status bar) are small
hand-written TypeScript modules with the same rules applied to each of them.

[![Quality](https://github.com/sviat-barbutsa/personal-atlas/actions/workflows/quality.yml/badge.svg)](https://github.com/sviat-barbutsa/personal-atlas/actions/workflows/quality.yml)

## If you are here to read the code

The site is small on purpose, so most of the interesting decisions sit in a handful of files:

- `scripts/check-architecture.mjs` - the rules that CI enforces beyond ESLint: which modules must stay pure
  (no `window`, `document`, `localStorage`, `Date.now()`, `Math.random()`), which old paths may not come back,
  file and function size, and the authored-pixel rule for CSS.
- `scripts/build-headers.mjs` - the CSP is generated after the build by hashing the inline scripts that were
  actually emitted, so the policy cannot drift from the HTML.
- `scripts/verify-wrangler-local.mjs` - the built site is started on a real local Workers static-asset server
  and the headers, the 404 page and the caching rules are asserted against it, not against Astro's preview.
- `src/theme/` - the theme switch: `state.ts` (storage, DOM commit), `strategy.ts` (which animation to run,
  from measurable facts), `theme-controller.ts` (the switch as a small state machine whose failure arms are
  unit tested).
- `src/lib/runtime/` - `pause-registry.ts` and `activity-gate.ts`. Every animation on the site registers with
  them: pause when off-screen or the tab is hidden, pause during a theme snapshot, respect reduced motion.
- `src/lib/telemetry.ts` + `telemetry-core.ts` - the only network request the site makes (`/cdn-cgi/trace`,
  same origin), decoded through allow-listed patterns before anything uses it.
- `src/lib/shell/` - the command line hidden in the hero: `commands.ts` (pure resolution, unit tested),
  `controller.ts` (input, answers, async commands), `view.ts` (DOM).
- `tests/e2e/routes.spec.ts` and `tests/e2e/accessibility.spec.ts` - every route in the sitemap is crawled
  with console/pageerror capture, link and asset resolution, and axe (WCAG 2.1 A/AA) in both themes.

## What is on the site

Home (hero atlas, doctrine line, selected work, recent writing), articles (a Markdown content collection with
typed frontmatter and pagination), work and case studies, a lab page listing the tools that are live, a
styleguide, about, contact, RSS and sitemap.

Two things you will notice on the home page:

- **The atlas.** An SVG map where a request finds its nearest edge node. If the site is served through
  Cloudflare, `/cdn-cgi/trace` gives the visitor's colo and country, and the route animates to that node; the
  status bar at the bottom shows the same facts plus TTFB and page weight. Nothing is stored or sent anywhere.
- **The doctrine line is a shell.** Click it or focus it and press Enter, then `help`. Commands navigate,
  toggle the theme or the X-ray overlay, or answer in the same line. There is an easter egg (`ls -a`).

## Architecture

**Static everywhere.** Nothing on the site needs a server, so every page is prerendered and served from the
edge; there is no Worker script running per request. If a route ever needs SSR it can adopt it individually
through the Cloudflare adapter - that trigger is written in `astro.config.mjs`.

**One place for each thing.**

- `src/layouts/Layout.astro` is the only head owner: title pattern, meta, canonical, Open Graph, JSON-LD, the
  pre-paint theme bootstrap and the speculation rules all come from here.
- `src/data/*.ts` and `*.json` hold typed site content (identity, projects, timeline). Components render it;
  they do not define it.
- `src/content.config.ts` is the article schema. A malformed date, a missing summary or a broken cover image
  fails the build.
- `src/lib/content/article-policy.ts` is the one place that decides which articles are published and in what
  order; the index, the pagination, the article page and the RSS feed all call it.
- `src/theme/palette.ts` mirrors `tokens.css` and a unit test keeps them equal, so the inline bootstrap and the
  `theme-color` meta can use the same values as the stylesheet.

**Runtime modules take their dependencies as parameters.** Anything listed as pure in `check-architecture.mjs`
receives `random`, `storage`, `document`, the observer constructor or the frame timestamp from its caller. That
is what makes the atlas model, the pause registry, the activity gate, the theme policy and the shell resolver
unit-testable in Node without a DOM. Each Astro component's `<script>` block is the composition root that wires
the real browser capabilities in.

**Animation has house rules.** They are the same for the atlas, the typewriter, the canvas engine behind the
game, and the theme transition: reduced motion means a static state and zero timers; nothing runs while
off-screen or in a hidden tab; everything registers with the pause registry so a theme-switch snapshot never
captures a mid-frame; motion never owns the state change (the theme is committed exactly once whether the
animation runs, is rejected or fails, and a failed animation downgrades the strategy for the rest of the
session).

**Theme.** Dark is the default and the OS preference is deliberately ignored - only the visitor's own toggle
changes it, and that choice is stored. The stored choice is applied by an inline script before first paint, and
a small inline `<style>` sets the canvas colour even before the stylesheet arrives, so there is no flash between
documents. Other tabs follow through the `storage` event.

**CSS.** `src/styles` is the only production stylesheet tree. `main.css` declares the cascade layer order
(`reset → tokens → base → composition → components → utilities`), `tokens.css` owns every colour, size, radius,
duration and z-index and uses `light-dark()` so each themed colour is defined once. Component styles live in
`src/styles/components/`; the map and the sizing rules are in
[docs/architecture/CSS_ARCHITECTURE.md](docs/architecture/CSS_ARCHITECTURE.md).

**Security headers.** `dist/_headers` is generated after the build: `default-src 'self'`, `connect-src 'self'`,
`object-src 'none'`, `frame-ancestors 'none'`, plus Referrer-Policy, COOP/CORP, nosniff, and a script-src made of
the SHA-256 hashes of the inline scripts found in the emitted HTML. `pnpm verify` then starts the built site on
a local Workers server and checks that the headers, the 404 handling and the immutable caching actually apply.

**What the browser stores.** Seven keys, all preferences or diagnostics, no identifiers: the theme choice in
`localStorage`, and in `sessionStorage` the theme-motion downgrade flag and its reason, the X-ray state and its
pinned edge, the game's best score and its sound setting. Every read is validated and every access is wrapped,
so blocked storage is not an error.

## Quality gate

`pnpm verify` is the single gate. It runs the same steps locally and in CI (Ubuntu, Node 24), in this order:

1. `prettier --check`
2. ESLint (including `astro` and `jsx-a11y` rules), Stylelint, and `scripts/check-architecture.mjs`
3. `astro check` (types across `.astro` and `.ts`)
4. Vitest with per-file coverage thresholds on the pure modules
5. `astro build`, then `scripts/build-headers.mjs`
6. Playwright against the built site: routes, accessibility, interactions, theme, atlas, shell, game, visual
   snapshots - on desktop Chromium and a Pixel 7 emulation
7. `scripts/verify-wrangler-local.mjs` - the built output on a real local Workers static-asset server

`pnpm release` runs `pnpm verify` and then `wrangler deploy`. `pnpm release:check` does the same with a dry-run
deploy.

Unit tests live in `tests/unit` and cover pure logic only. Everything that depends on the browser - focus,
dialogs, storage, `matchMedia`, portals, the real 404 - is tested in `tests/e2e`. There is no property-based or
model-checking lane; the decision surfaces here are small enough to enumerate by hand.

Honest limits of the evidence: the browser tests run on Chromium only (desktop and mobile emulation); there is
no branded-browser, real-device or screen-reader run.

## Decisions worth knowing

- **No admin panel.** Content is typed Markdown in Git; editing happens in the editor, validation in the
  schema, publishing through `pnpm release`, history in Git. A CMS would add a second write path and external
  dependencies for a weaker version of what the build already enforces. If remote editing ever becomes a
  recurring need, the plan is a git-backed panel (Sveltia CMS as a static `/admin` page committing through the
  GitHub API). It ships as plain static assets, so it cannot affect public routes. Not built until needed.
- **OS colour scheme is ignored.** Dark is the brand default; light is a choice, not a mirror of the system.
  It is written down in `tokens.css` and `src/theme/state.ts` and tested, so it is a policy, not an accident.
- **Hard size budgets.** Files stay under 250 lines and functions under 120 (`scripts/budgets.mjs`, applied by
  ESLint for TypeScript and by the architecture script for `.astro` and `.css`). This is a backstop for a
  one-person codebase, not a design tool: when it fires the answer is a better boundary, not a smaller file.
- **The canvas engine stayed.** The atlas moved from Canvas to SVG (the old files are banned by name in the
  architecture check so they cannot come back); the generic Canvas engine remains because the game uses it.
- **`/styleguide` is a production route.** It renders through the same layout and imports as every other page,
  so it doubles as a living check that the tokens and components still compose.

## Development

Node 24 and pnpm 10 (`.node-version`, `packageManager` in `package.json`).

```bash
pnpm install --frozen-lockfile
pnpm dev             # local dev server
pnpm verify          # the full gate, see above
pnpm build           # astro build + generated headers
pnpm test:e2e        # build, then Playwright
pnpm release:check   # verify + wrangler deploy --dry-run
pnpm release         # verify + wrangler deploy
```

Writing an article: see [docs/authoring.md](docs/authoring.md).

Generated output and reports (`dist`, `.astro`, `coverage`, `playwright-report`, `test-results`) are ignored.

## License

Source-available, all rights reserved. You are welcome to read the code; nothing here is licensed for reuse.
See [LICENSE](LICENSE).
