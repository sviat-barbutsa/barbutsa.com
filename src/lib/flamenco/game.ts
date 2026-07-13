/**
 * flamenco/game — the packet runner. You are a request on the edge;
 * jump the cold starts and MISS blocks; score is milliseconds saved.
 * Built on the site's canvas-engine (RAF, pause, DPR, tokens) — the
 * engine finally earns its keep. Drawn 100% with intent tokens, so
 * the game is theme-correct in dark and light without knowing either.
 */

import { Engine, type Entity, type FrameInfo } from "../canvas-engine/engine";

const GROUND_RATIO = 0.78; // ground y as fraction of height
const GRAVITY = 2600; // px/s²
const JUMP_VY = -760; // px/s
const BASE_SPEED = 260; // px/s, ramps up
const RAMP = 6; // px/s gained per second
const PLAYER_X = 72;
const PLAYER_SIZE = 14;

type Phase = "ready" | "running" | "dead";

interface Obstacle {
  x: number;
  w: number;
  h: number;
  label: string;
  cleared: boolean;
}

/** Pure AABB overlap — exported for tests/tuning. */
export function hits(
  px: number, py: number, ps: number,
  ox: number, oy: number, ow: number, oh: number,
): boolean {
  return px < ox + ow && px + ps > ox && py < oy + oh && py + ps > oy;
}

export interface GameHooks {
  onScore?: (msSaved: number, hitsCleared: number, best: number) => void;
  onPhase?: (phase: Phase) => void;
  onJump?: () => void;
  onClear?: () => void;
  onDie?: () => void;
  onMilestone?: (msSaved: number) => void;
}

export class PacketRunner implements Entity {
  phase: Phase = "ready";
  private y = 0;
  private vy = 0;
  private speed = BASE_SPEED;
  private distance = 0;
  private cleared = 0;
  private spawnIn = 1.2;
  private obstacles: Obstacle[] = [];
  private best: number;
  private lastMilestone = 0;

  constructor(private hooks: GameHooks = {}) {
    let stored = 0;
    try {
      stored = Number(sessionStorage.getItem("flamenco-best")) || 0;
    } catch { /* optional */ }
    this.best = stored;
  }

  get msSaved(): number {
    return Math.floor(this.distance / 8);
  }

  jump(): void {
    if (this.phase === "ready") {
      this.phase = "running";
      this.hooks.onPhase?.(this.phase);
      return;
    }
    if (this.phase === "dead") {
      this.reset();
      return;
    }
    if (this.y === 0) {
      this.vy = JUMP_VY;
      this.hooks.onJump?.();
    }
  }

  private reset(): void {
    this.lastMilestone = 0;
    this.y = 0;
    this.vy = 0;
    this.speed = BASE_SPEED;
    this.distance = 0;
    this.cleared = 0;
    this.spawnIn = 1.2;
    this.obstacles = [];
    this.phase = "running";
    this.hooks.onPhase?.(this.phase);
  }

  private die(): void {
    this.phase = "dead";
    this.hooks.onDie?.();
    if (this.msSaved > this.best) {
      this.best = this.msSaved;
      try {
        sessionStorage.setItem("flamenco-best", String(this.best));
      } catch { /* optional */ }
    }
    this.hooks.onPhase?.(this.phase);
  }

  update(f: FrameInfo): void {
    if (this.phase !== "running") return;
    const dt = f.dt;

    this.speed += RAMP * dt;
    this.distance += this.speed * dt;

    /* physics */
    this.vy += GRAVITY * dt;
    this.y = Math.min(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;

    /* spawn */
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const tall = Math.random() < 0.3;
      this.obstacles.push({
        x: f.width + 40,
        w: tall ? 16 : 22 + Math.random() * 18,
        h: tall ? 34 + Math.random() * 10 : 16 + Math.random() * 10,
        label: tall ? "COLD" : "MISS",
        cleared: false,
      });
      /* gap shrinks as speed grows, floored so it stays clearable */
      this.spawnIn = Math.max(0.55, 1.5 - this.speed / 900) + Math.random() * 0.5;
    }

    /* move + collide */
    const groundY = f.height * GROUND_RATIO;
    const py = groundY - PLAYER_SIZE + this.y;
    for (const o of this.obstacles) {
      o.x -= this.speed * dt;
      if (!o.cleared && o.x + o.w < PLAYER_X) {
        o.cleared = true;
        this.cleared += 1;
        this.hooks.onClear?.();
      }
      if (hits(PLAYER_X, py, PLAYER_SIZE, o.x, groundY - o.h, o.w, o.h)) {
        this.die();
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.x > -60);

    const milestone = Math.floor(this.msSaved / 1000);
    if (milestone > this.lastMilestone) {
      this.lastMilestone = milestone;
      this.hooks.onMilestone?.(this.msSaved);
    }

    this.hooks.onScore?.(this.msSaved, this.cleared, this.best);
  }

  draw(ctx: CanvasRenderingContext2D, f: FrameInfo): void {
    const signal = f.tokens["--color-signal"] || "#d4f34a";
    const text = f.tokens["--color-text"] || "#ece9e2";
    const dim = f.tokens["--color-text-2"] || "#9a968a";
    const faint = f.tokens["--color-faint"] || "#57544b";
    const groundY = f.height * GROUND_RATIO;

    /* ground: hairline + passing dashes (the edge, streaming by) */
    ctx.strokeStyle = dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(f.width, groundY + 0.5);
    ctx.stroke();
    ctx.strokeStyle = faint;
    const dashShift = (this.distance * 0.9) % 26;
    for (let x = -dashShift; x < f.width; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 7);
      ctx.lineTo(x + 10, groundY + 7);
      ctx.stroke();
    }

    /* obstacles */
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    for (const o of this.obstacles) {
      ctx.strokeStyle = o.cleared ? faint : text;
      ctx.strokeRect(o.x + 0.5, groundY - o.h + 0.5, o.w, o.h);
      ctx.fillStyle = o.cleared ? faint : dim;
      ctx.fillText(o.label, o.x + o.w / 2, groundY - o.h - 5);
    }

    /* the packet: square with a short trail */
    const py = groundY - PLAYER_SIZE + this.y;
    ctx.fillStyle = signal;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(PLAYER_X - 14, py + 4, 8, PLAYER_SIZE - 8);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(PLAYER_X - 7, py + 2, 5, PLAYER_SIZE - 4);
    ctx.globalAlpha = 1;
    ctx.fillRect(PLAYER_X, py, PLAYER_SIZE, PLAYER_SIZE);

    /* HUD — the score is primary info: full text color, not decor tones */
    ctx.textAlign = "left";
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = text;
    ctx.fillText(`${this.msSaved}ms saved`, 14, 22);
    ctx.fillStyle = signal;
    ctx.fillText(`HIT ×${this.cleared}`, 14, 38);
    ctx.fillStyle = dim;
    ctx.textAlign = "right";
    ctx.fillText(`best ${Math.max(this.best, this.msSaved)}ms`, f.width - 14, 22);

    /* state overlays */
    ctx.textAlign = "center";
    if (this.phase === "ready") {
      ctx.fillStyle = text;
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText("YOU ARE A REQUEST. STAY CACHED.", f.width / 2, f.height * 0.36);
      ctx.fillStyle = dim;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText("SPACE / ↑ / TAP — JUMP THE COLD STARTS", f.width / 2, f.height * 0.36 + 22);
    } else if (this.phase === "dead") {
      ctx.fillStyle = text;
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText(`ORIGIN REACHED THE HARD WAY — ${this.msSaved}ms saved`, f.width / 2, f.height * 0.36);
      ctx.fillStyle = dim;
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText("SPACE — RETRY · ESC — QUIT", f.width / 2, f.height * 0.36 + 22);
    }
  }
}

export function createGame(
  canvas: HTMLCanvasElement,
  hooks?: GameHooks,
): { engine: Engine; runner: PacketRunner } {
  const engine = new Engine(canvas, {
    tokens: ["--color-signal", "--color-text", "--color-text-2", "--color-faint"],
  });
  const runner = new PacketRunner(hooks);
  engine.scene.add(runner);
  engine.start();
  return { engine, runner };
}
