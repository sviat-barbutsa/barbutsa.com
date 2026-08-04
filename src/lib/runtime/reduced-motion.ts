/**
 * One owner for the reduced-motion preference.
 *
 * The query string was written out at five call sites — the typer, the atlas controller, the canvas
 * engine, the shell easter egg and the strategy facts. Five copies of a string that must match
 * exactly is five chances to typo one and silently animate for someone who asked us not to.
 *
 * Read at call time rather than captured at module load, so a caller that asks again after the
 * visitor changes the setting gets the new answer. Callers that cache the result themselves keep
 * whatever staleness they already had; that is their decision to make, not this module's.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}
