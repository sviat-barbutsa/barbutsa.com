/**
 * atlas — public API. One call wires the whole hero scene:
 *
 *   const atlas = createAtlas(canvas, readoutEl);
 *   // later: atlas.destroy()
 *
 * The Engine handles lifecycle (pause offscreen, reduced motion,
 * theme re-reads); this module only composes entities and feeds the
 * route readout line.
 */

import { Engine } from "../canvas-engine/engine";
import { ATLAS_TOKENS, type Route } from "./config";
import { LinkMesh, NodeField, Pulse } from "./entities";

export interface AtlasHandle {
  destroy(): void;
}

export function createAtlas(
  canvas: HTMLCanvasElement,
  readout?: HTMLElement | null,
): AtlasHandle {
  const engine = new Engine(canvas, { tokens: ATLAS_TOKENS });

  const announce = (route: Route): void => {
    if (!readout) return;
    const from = route.path[route.path.length - 1]!.toUpperCase();
    readout.textContent = `route: ${from} → client · ttfb ${route.ttfb}ms · cache: ${route.cache}`;
  };

  engine.scene.add(new LinkMesh());
  engine.scene.add(new NodeField());
  engine.scene.add(new Pulse(announce));

  engine.start();
  return { destroy: () => engine.destroy() };
}
