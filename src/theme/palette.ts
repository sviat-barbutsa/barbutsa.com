/**
 * The canonical TS-side mirror of tokens.css' raw palette.
 *
 * tokens.css remains the styling source of truth. Everything that needs a
 * color OUTSIDE the cascade — the pre-paint canvas guard, the theme-color
 * meta, canvas-render fallbacks — must consume THIS module, never a hex
 * literal. tests/unit/palette-sync.test.ts fails the build if this mirror
 * and tokens.css ever disagree.
 */
export const PALETTE = {
  ink: "#141412",
  paper: "#ece9e2",
  chartreuse: "#d4f34a",
  dim: "#9a968a",
  faint: "#57544b",
} as const;
