/**
 * atlas/math — pure functions, zero DOM imports. Unit-tested in
 * tests/atlas-math.test.ts without a browser.
 */

export interface Point {
  x: number;
  y: number;
}

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export const easeInOut = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Control point for a quadratic arc bowing gently between a and b. */
export function arcControl(a: Point, b: Point, bow = 0.12): Point {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // Perpendicular offset, scaled by segment length.
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { x: mx - dy * bow, y: my + dx * bow };
}

/** Point at parameter t (0..1) on the quadratic arc a→b. */
export function arcPoint(a: Point, b: Point, t: number, bow = 0.12): Point {
  const c = arcControl(a, b, bow);
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

/**
 * Where is the pulse at `elapsed` seconds into a route of `arcs` arcs?
 * Returns arc index and local t, or null when the route has finished.
 */
export function routePosition(
  elapsed: number,
  arcs: number,
  arcSeconds: number,
): { arc: number; t: number } | null {
  if (arcs <= 0 || elapsed < 0) return null;
  const total = arcs * arcSeconds;
  if (elapsed >= total) return null;
  const arc = Math.min(arcs - 1, Math.floor(elapsed / arcSeconds));
  return { arc, t: easeInOut((elapsed - arc * arcSeconds) / arcSeconds) };
}
