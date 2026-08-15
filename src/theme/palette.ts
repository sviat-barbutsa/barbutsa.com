/**
 * TS mirror of the raw palette in tokens.css.
 *
 * tokens.css stays the source of truth for styling. Anything that needs a color
 * outside the cascade (pre-paint canvas guard, theme-color meta, canvas render
 * fallbacks) reads from here instead of hardcoding a hex.
 * tests/unit/palette-sync.test.ts fails the build if this and tokens.css disagree.
 */
export const PALETTE = {
  ink: "#141412",
  paper: "#ece9e2",
  chartreuse: "#d4f34a",
  dim: "#9a968a",
  faint: "#57544b",
  /* light ramp dim - used by the theme-switch e2e assertion */
  lDim: "#5c584c",
} as const;
