/**
 * One place for the reduced-motion query. The string used to be copy-pasted in
 * five places (typer, atlas controller, canvas engine, shell, theme strategy) -
 * easy to typo one copy and keep animating for someone who turned motion off.
 *
 * Read at call time, not cached at module load, so if the visitor changes the
 * setting later callers get the new answer.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}
