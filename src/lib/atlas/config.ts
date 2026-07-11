/**
 * atlas/config — the scene as DATA. Want a new PoP or route? Edit here.
 * Positions are unit coordinates (0..1) mapped onto the canvas.
 */

export interface PopNode {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Origin node renders larger with a label underneath. */
  origin?: boolean;
}

export interface Route {
  /** Node ids the pulse travels through, in order. */
  path: string[];
  /** Milliseconds shown in the readout when this route completes. */
  ttfb: number;
  cache: "HIT" | "MISS";
}

export const NODES: PopNode[] = [
  { id: "origin", label: "ORIGIN", x: 0.5, y: 0.52, origin: true },
  { id: "ams", label: "AMS", x: 0.41, y: 0.18 },
  { id: "fra", label: "FRA", x: 0.49, y: 0.24 },
  { id: "lhr", label: "LHR", x: 0.37, y: 0.28 },
  { id: "waw", label: "WAW", x: 0.68, y: 0.26 },
  { id: "nrt", label: "NRT", x: 0.86, y: 0.3 },
  { id: "iad", label: "IAD", x: 0.16, y: 0.34 },
  { id: "dxb", label: "DXB", x: 0.7, y: 0.5 },
  { id: "sin", label: "SIN", x: 0.8, y: 0.62 },
  { id: "gru", label: "GRU", x: 0.25, y: 0.78 },
  { id: "jnb", label: "JNB", x: 0.55, y: 0.82 },
  { id: "syd", label: "SYD", x: 0.9, y: 0.8 },
];

/** Arcs drawn as the resting network (pairs of node ids). */
export const LINKS: Array<[string, string]> = [
  ["origin", "ams"], ["origin", "fra"], ["origin", "lhr"],
  ["origin", "waw"], ["origin", "iad"], ["origin", "dxb"],
  ["origin", "sin"], ["origin", "gru"], ["origin", "jnb"],
  ["origin", "syd"], ["origin", "nrt"],
  ["ams", "fra"], ["fra", "waw"], ["lhr", "ams"], ["waw", "nrt"],
  ["dxb", "sin"], ["sin", "syd"], ["iad", "gru"], ["jnb", "dxb"],
];

/** Pulses cycle through these routes; readout updates on completion. */
export const ROUTES: Route[] = [
  { path: ["origin", "fra"], ttfb: 41, cache: "HIT" },
  { path: ["origin", "waw", "nrt"], ttfb: 129, cache: "HIT" },
  { path: ["origin", "lhr"], ttfb: 38, cache: "HIT" },
  { path: ["origin", "iad"], ttfb: 87, cache: "MISS" },
  { path: ["origin", "dxb", "sin"], ttfb: 114, cache: "HIT" },
  { path: ["origin", "gru"], ttfb: 132, cache: "HIT" },
];

/** Seconds a pulse takes per arc, and idle time between routes. */
export const PULSE_ARC_SECONDS = 0.9;
export const PULSE_GAP_SECONDS = 1.6;

/** Tokens the scene consumes — must exist in styles/tokens.css. */
export const ATLAS_TOKENS = [
  "--color-signal",
  "--color-text-2",
  "--color-faint",
  "--color-border",
] as const;
