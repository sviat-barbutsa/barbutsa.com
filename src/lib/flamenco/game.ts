/** Packet-runner simulation. Canvas rendering lives in runner-renderer.ts. */

import { Engine, type Entity, type FrameInfo } from "../canvas-engine/engine";
import { hits } from "./collision";
import { GROUND_RATIO, PLAYER_SIZE, PLAYER_X } from "./geometry";
import { drawRunner } from "./runner-renderer";
import { readBestScore, writeBestScore } from "./score-storage";

const GRAVITY = 2600;
const JUMP_VY = -760;
const BASE_SPEED = 260;
const RAMP = 6;

type Phase = "ready" | "running" | "dead";

interface Obstacle {
  x: number;
  w: number;
  h: number;
  label: string;
  cleared: boolean;
}

export { hits };

export interface GameHooks {
  onScore?: (msSaved: number, hitsCleared: number, best: number) => void;
  onPhase?: (phase: Phase) => void;
  onJump?: () => void;
  onClear?: () => void;
  onDie?: () => void;
  onMilestone?: (msSaved: number) => void;
}

export interface RunnerOptions {
  random?: () => number;
  scoreStorage?: Storage | null;
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
  private random: () => number;
  private scoreStorage: Storage | null | undefined;

  constructor(
    private hooks: GameHooks = {},
    options: RunnerOptions = {},
  ) {
    this.random = options.random ?? Math.random;
    this.scoreStorage = options.scoreStorage;
    this.best = readBestScore(this.scoreStorage);
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
      writeBestScore(this.best, this.scoreStorage);
    }
    this.hooks.onPhase?.(this.phase);
  }

  update(frame: FrameInfo): void {
    if (this.phase !== "running") return;
    const { dt } = frame;
    this.speed += RAMP * dt;
    this.distance += this.speed * dt;
    this.vy += GRAVITY * dt;
    this.y = Math.min(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) this.spawn(frame.width);

    const groundY = frame.height * GROUND_RATIO;
    const playerY = groundY - PLAYER_SIZE + this.y;
    for (const obstacle of this.obstacles) {
      obstacle.x -= this.speed * dt;
      if (!obstacle.cleared && obstacle.x + obstacle.w < PLAYER_X) {
        obstacle.cleared = true;
        this.cleared += 1;
        this.hooks.onClear?.();
      }
      if (hits(PLAYER_X, playerY, PLAYER_SIZE, obstacle.x, groundY - obstacle.h, obstacle.w, obstacle.h)) {
        this.die();
        break;
      }
    }
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -60);

    const milestone = Math.floor(this.msSaved / 1000);
    if (milestone > this.lastMilestone) {
      this.lastMilestone = milestone;
      this.hooks.onMilestone?.(this.msSaved);
    }
    this.hooks.onScore?.(this.msSaved, this.cleared, this.best);
  }

  draw(ctx: CanvasRenderingContext2D, frame: FrameInfo): void {
    drawRunner(ctx, frame, {
      phase: this.phase,
      y: this.y,
      distance: this.distance,
      cleared: this.cleared,
      best: this.best,
      msSaved: this.msSaved,
      obstacles: this.obstacles,
    });
  }

  private spawn(width: number): void {
    const tall = this.random() < 0.3;
    this.obstacles.push({
      x: width + 40,
      w: tall ? 16 : 22 + this.random() * 18,
      h: tall ? 34 + this.random() * 10 : 16 + this.random() * 10,
      label: tall ? "COLD" : "MISS",
      cleared: false,
    });
    this.spawnIn = Math.max(0.55, 1.5 - this.speed / 900) + this.random() * 0.5;
  }
}

export function createGame(canvas: HTMLCanvasElement, hooks?: GameHooks): { engine: Engine; runner: PacketRunner } {
  const engine = new Engine(canvas, {
    tokens: ["--color-signal", "--color-text", "--color-text-2", "--color-faint"],
  });
  const runner = new PacketRunner(hooks);
  engine.scene.add(runner);
  engine.start();
  return { engine, runner };
}
