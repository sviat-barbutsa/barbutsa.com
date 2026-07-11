/**
 * atlas/entities — Nodes, Links, and the traveling Pulse. Each is a
 * small Entity; the scene is composed in index.ts.
 */

import type { Entity, FrameInfo } from "../canvas-engine/entity";
import {
  NODES,
  LINKS,
  ROUTES,
  PULSE_ARC_SECONDS,
  PULSE_GAP_SECONDS,
  type PopNode,
  type Route,
} from "./config";
import { arcControl, arcPoint, routePosition, type Point } from "./math";

const px = (n: PopNode, f: FrameInfo): Point => ({
  x: n.x * f.width,
  y: n.y * f.height,
});

const byId = new Map(NODES.map((n) => [n.id, n]));

export class LinkMesh implements Entity {
  update(): void {}

  draw(ctx: CanvasRenderingContext2D, f: FrameInfo): void {
    ctx.strokeStyle = f.tokens["--color-border"] || "#2b2a24";
    ctx.lineWidth = 1;
    for (const [aId, bId] of LINKS) {
      const a = px(byId.get(aId)!, f);
      const b = px(byId.get(bId)!, f);
      const c = arcControl(a, b);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
      ctx.stroke();
    }
  }
}

export class NodeField implements Entity {
  update(): void {}

  draw(ctx: CanvasRenderingContext2D, f: FrameInfo): void {
    const dim = f.tokens["--color-text-2"] || "#9a968a";
    const faint = f.tokens["--color-faint"] || "#57544b";
    const signal = f.tokens["--color-signal"] || "#d4f34a";

    ctx.font =
      '500 9px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = "center";

    for (const n of NODES) {
      const p = px(n, f);
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.origin ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = n.origin ? signal : dim;
      ctx.fill();

      ctx.fillStyle = n.origin ? dim : faint;
      ctx.fillText(n.label, p.x, p.y + (n.origin ? 16 : 12));
    }
  }
}

export interface PulseState {
  route: Route;
  /** Fires when a pulse completes its route (drives the readout). */
  onArrive?: (route: Route) => void;
}

export class Pulse implements Entity {
  private routeIndex = 0;
  private clock = 0;
  private idle = 0;

  constructor(private onArrive?: (route: Route) => void) {}

  private get route(): Route {
    return ROUTES[this.routeIndex % ROUTES.length]!;
  }

  update(f: FrameInfo): void {
    if (f.reducedMotion) return;

    if (this.idle > 0) {
      this.idle -= f.dt;
      if (this.idle <= 0) {
        this.routeIndex += 1;
        this.clock = 0;
      }
      return;
    }

    this.clock += f.dt;
    const arcs = this.route.path.length - 1;
    if (routePosition(this.clock, arcs, PULSE_ARC_SECONDS) === null) {
      this.onArrive?.(this.route);
      this.idle = PULSE_GAP_SECONDS;
    }
  }

  draw(ctx: CanvasRenderingContext2D, f: FrameInfo): void {
    const signal = f.tokens["--color-signal"] || "#d4f34a";
    const route = this.route;
    const arcs = route.path.length - 1;
    const pos = routePosition(this.clock, arcs, PULSE_ARC_SECONDS);

    // Static frame under reduced motion: show the first route, mid-arc.
    const at =
      f.reducedMotion
        ? { arc: 0, t: 0.55 }
        : pos;
    if (!at) return;

    const a = px(byId.get(route.path[at.arc]!)!, f);
    const b = px(byId.get(route.path[at.arc + 1]!)!, f);

    // Trail: brighten the active arc slightly.
    const c = arcControl(a, b);
    ctx.strokeStyle = signal;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const p = arcPoint(a, b, at.t);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = signal;
    ctx.fill();
  }
}
