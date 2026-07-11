/**
 * canvas-engine/engine — lifecycle for Canvas2D scenes. ~2KB, zero deps.
 *
 * Owns everything a scene should never re-implement:
 *  - RAF loop with clamped delta time
 *  - auto-pause when offscreen (IntersectionObserver) or tab hidden
 *  - DPR-aware sizing via ResizeObserver (draws in CSS pixels)
 *  - prefers-reduced-motion → one static frame, no loop
 *  - token theming via computed style (light-dark() safe)
 *  - clean destroy() with no leaked observers/frames
 *
 * Scenes provide entities; the engine provides time and discipline.
 * If a scene outgrows this file, it belongs in a lab, not here.
 */

import { EntityGroup, type Entity, type FrameInfo } from "./entity";
import { readTokens } from "./theme";
import { register, deregister } from "./registry";

export interface EngineOptions {
  /** CSS custom property names the scene consumes. */
  tokens: readonly string[];
  /** Cap for delta time in seconds (default 1/20 — tab-switch safety). */
  maxDt?: number;
}

export class Engine {
  readonly scene = new EntityGroup();

  private ctx: CanvasRenderingContext2D;
  private tokens: Record<string, string> = {};
  private tokenNames: readonly string[];
  private maxDt: number;

  private rafId = 0;
  private running = false;
  private pausedByUser = false;
  private visible = true;
  private pageVisible = true;
  private startTime = 0;
  private lastTime = 0;

  private width = 0;
  private height = 0;

  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private reduced: MediaQueryList;
  private onVisibility = () => {
    this.pageVisible = document.visibilityState === "visible";
    this.syncRunning();
  };

  constructor(
    private canvas: HTMLCanvasElement,
    options: EngineOptions,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-engine: 2d context unavailable");
    this.ctx = ctx;
    this.tokenNames = options.tokens;
    this.maxDt = options.maxDt ?? 1 / 20;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);

    this.io = new IntersectionObserver(
      (entries) => {
        this.visible = entries[entries.length - 1]?.isIntersecting ?? true;
        this.syncRunning();
      },
      { rootMargin: "64px" },
    );
    this.io.observe(canvas);

    document.addEventListener("visibilitychange", this.onVisibility);
  }

  start(): void {
    this.refreshTheme();
    this.resize();
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    register(this);

    if (this.reduced.matches) {
      // Stillness: a single, correct frame.
      this.renderFrame(0);
      return;
    }
    this.running = true;
    this.syncRunning();
  }

  /** External pause (theme controller, tests). Sticky until resume(). */
  pause(): void {
    this.pausedByUser = true;
    this.syncRunning();
  }

  resume(): void {
    this.pausedByUser = false;
    if (this.reduced.matches) {
      this.renderFrame(0);
      return;
    }
    this.lastTime = performance.now(); // don't integrate the paused gap
    this.syncRunning();
  }

  refreshTheme(): void {
    this.tokens = readTokens(this.canvas, this.tokenNames);
    if (!this.running || this.reduced.matches) this.renderFrame(0);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ro.disconnect();
    this.io.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    deregister(this);
  }

  private get shouldLoop(): boolean {
    return (
      this.running && this.visible && this.pageVisible && !this.pausedByUser
    );
  }

  private syncRunning(): void {
    cancelAnimationFrame(this.rafId);
    if (this.shouldLoop) this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    if (!this.shouldLoop) return;
    const dt = Math.min((now - this.lastTime) / 1000, this.maxDt);
    this.lastTime = now;
    this.renderFrame(dt, now);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private renderFrame(dt: number, now = performance.now()): void {
    const frame: FrameInfo = {
      dt,
      elapsed: (now - this.startTime) / 1000,
      width: this.width,
      height: this.height,
      tokens: this.tokens,
      reducedMotion: this.reduced.matches,
    };
    this.scene.update(frame);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.scene.draw(this.ctx, frame);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.shouldLoop) this.renderFrame(0);
  }
}

export type { Entity, FrameInfo };
