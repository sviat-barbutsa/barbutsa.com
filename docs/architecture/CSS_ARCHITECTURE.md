# CSS Architecture

`src/styles` is the only production CSS source. The parent directory has no parallel runtime stylesheet or demo; its
short architecture and publish documents point here.

## Cascade contract

`src/styles/main.css` declares the only layer order:

```text
reset → tokens → base → composition → components → utilities
```

Rules:

- `main.css` declares layers and imports only.
- `tokens.css` owns colors, typography, spacing scale, radii, durations, easing, and z-index.
- `base.css` owns unclassed element defaults.
- `composition.css` owns reusable layout primitives.
- `shared-motion.css` owns keyframes used by more than one feature.
- Feature/component styling lives in `src/styles/components/`.
- `utilities.css` stays small and last.
- Component-local geometry and optical offsets are allowed when they are intrinsic to that component.
- Inline styles are reserved for CSS custom-property knobs and genuinely dynamic demos.
- Astro pages do not own scoped static CSS; page-specific rules use a named feature stylesheet in the canonical tree.

## Component CSS map

- `core.css` — kick, label, button, index row, panel.
- `contact.css` — protocol/contact card and shared conf rows.
- `theme-toggle.css` — theme switch control.
- `site-chrome.css` — skip link, header, brand/nav, footer, footer controls.
- `atlas.css` — SVG Atlas frame, nodes, route, readout, tooltip.
- `content.css` — page heads, prose, pager.
- `home.css` — homepage hero, writing split, case-card state, and contact copy.
- `about.css` — About-page copy and education treatment.
- `styleguide.css` — visual samples used only by the living styleguide.
- `terminal.css` — typewriter line, shell input, shell opener.
- `xray.css` — X-ray outlines and legend.
- `status-bar.css` — editor-style status bar.
- `flamenco.css` — lazy-loaded game overlay.

## Motion

Theme-switch transitions are scoped to `html[data-theme-motion]` in `theme-motion.css`. Cross-document page transitions
are absent from the production import graph; `page-transitions.css` remains a separate protected experiment.

The SVG Atlas is the ambient signature animation. Reduced-motion users get a static routed state. Other animation should be user-triggered, short, and limited to transform/opacity/clip effects that do not force layout.

## Budgets

Maintained `.ts`, `.astro`, and `.css` files must stay under 250 physical lines unless a narrow declarative exception is documented. Runtime controller functions must stay under 120 physical lines. `scripts/check-file-budgets.mjs` enforces this in `pnpm lint`.

## Living reference

`/styleguide` is the production-backed visual reference. It exercises the same imports as every public route and must
retain exactly one semantic `h1`.
