import type { AtlasRoute } from "./types";
import type { AtlasView } from "./view";

const DRAW_MS = 950;
const HOLD_MS = 3400;
const FADE_MS = 450;

type Phase = "idle" | "draw" | "hold" | "fade";

interface RouteAnimatorOptions {
  view: AtlasView;
  nextRoute: () => AtlasRoute;
  getTelemetryRoute: () => Parameters<AtlasView["renderRoute"]>[1];
}

export class RouteAnimator {
  private raf = 0;
  private running = false;
  private destroyed = false;
  private phase: Phase = "idle";
  private startTime = 0;
  private lastFrameTime = 0;
  private pausedAt = 0;
  private adjustForPause = false;
  private routeLength = 0;
  private current: AtlasRoute | null = null;

  constructor(private options: RouteAnimatorOptions) {}

  pause(): void {
    if (!this.running) return;
    this.running = false;
    this.pausedAt = this.lastFrameTime;
    cancelAnimationFrame(this.raf);
  }

  resume(): void {
    if (this.destroyed || this.running) return;
    this.running = true;
    this.adjustForPause = this.pausedAt > 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    this.destroyed = true;
    this.pause();
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    if (this.adjustForPause) {
      if (this.startTime) this.startTime += now - this.pausedAt;
      this.adjustForPause = false;
      this.pausedAt = 0;
    }
    this.lastFrameTime = now;
    if (!this.startTime) this.startTime = now;
    let elapsed = now - this.startTime;

    if (this.phase === "idle") {
      this.current = this.options.nextRoute();
      this.routeLength = this.options.view.setRoute(this.current.code);
      this.options.view.markHot(null);
      this.phase = "draw";
      this.startTime = now;
      elapsed = 0;
    }

    if (this.phase === "draw") {
      this.draw(elapsed, now);
    } else if (this.phase === "hold") {
      this.hold(elapsed, now);
    } else if (this.phase === "fade" && elapsed >= FADE_MS) {
      this.phase = "idle";
      this.startTime = 0;
    }

    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(elapsed: number, now: number): void {
    const progress = Math.min(elapsed / DRAW_MS, 1);
    const eased = 1 - (1 - progress) ** 3;
    this.options.view.setRouteProgress(this.routeLength, eased);
    this.options.view.setPulseOpacity(progress < 0.06 ? progress / 0.06 : 1);
    if (progress < 1 || !this.current) return;
    this.phase = "hold";
    this.startTime = now;
    this.options.view.markHot(this.current.code);
    this.options.view.renderRoute(this.current, this.options.getTelemetryRoute());
  }

  private hold(elapsed: number, now: number): void {
    this.options.view.setPulseOpacity(Math.max(0, 1 - elapsed / 300));
    if (elapsed < HOLD_MS) return;
    this.phase = "fade";
    this.startTime = now;
    this.options.view.setRouteVisible(false);
  }
}
