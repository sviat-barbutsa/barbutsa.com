import type { FrameInfo } from "../canvas-engine/engine";
import { GROUND_RATIO, PLAYER_SIZE, PLAYER_X } from "./geometry";

export interface RunnerObstacleView {
  x: number;
  w: number;
  h: number;
  label: string;
  cleared: boolean;
}

export interface RunnerViewState {
  phase: "ready" | "running" | "dead";
  y: number;
  distance: number;
  cleared: number;
  best: number;
  msSaved: number;
  obstacles: readonly RunnerObstacleView[];
}

export function drawRunner(ctx: CanvasRenderingContext2D, frame: FrameInfo, state: RunnerViewState): void {
  const signal = frame.tokens["--color-signal"] || "#d4f34a";
  const text = frame.tokens["--color-text"] || "#ece9e2";
  const dim = frame.tokens["--color-text-2"] || "#9a968a";
  const faint = frame.tokens["--color-faint"] || "#57544b";
  const groundY = frame.height * GROUND_RATIO;

  ctx.strokeStyle = dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 0.5);
  ctx.lineTo(frame.width, groundY + 0.5);
  ctx.stroke();
  ctx.strokeStyle = faint;
  const dashShift = (state.distance * 0.9) % 26;
  for (let x = -dashShift; x < frame.width; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 7);
    ctx.lineTo(x + 10, groundY + 7);
    ctx.stroke();
  }

  ctx.font = '500 8px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  for (const obstacle of state.obstacles) {
    ctx.strokeStyle = obstacle.cleared ? faint : text;
    ctx.strokeRect(obstacle.x + 0.5, groundY - obstacle.h + 0.5, obstacle.w, obstacle.h);
    ctx.fillStyle = obstacle.cleared ? faint : dim;
    ctx.fillText(obstacle.label, obstacle.x + obstacle.w / 2, groundY - obstacle.h - 5);
  }

  const playerY = groundY - PLAYER_SIZE + state.y;
  ctx.fillStyle = signal;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(PLAYER_X - 14, playerY + 4, 8, PLAYER_SIZE - 8);
  ctx.globalAlpha = 0.5;
  ctx.fillRect(PLAYER_X - 7, playerY + 2, 5, PLAYER_SIZE - 4);
  ctx.globalAlpha = 1;
  ctx.fillRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE);

  ctx.textAlign = "left";
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillStyle = text;
  ctx.fillText(`${state.msSaved}ms saved`, 14, 22);
  ctx.fillStyle = signal;
  ctx.fillText(`HIT ×${state.cleared}`, 14, 38);
  ctx.fillStyle = dim;
  ctx.textAlign = "right";
  ctx.fillText(`best ${Math.max(state.best, state.msSaved)}ms`, frame.width - 14, 22);

  ctx.textAlign = "center";
  if (state.phase === "ready") {
    ctx.fillStyle = text;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText("YOU ARE A REQUEST. STAY CACHED.", frame.width / 2, frame.height * 0.36);
    ctx.fillStyle = dim;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText("SPACE / ↑ / TAP — JUMP THE COLD STARTS", frame.width / 2, frame.height * 0.36 + 22);
  } else if (state.phase === "dead") {
    ctx.fillStyle = text;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(`ORIGIN REACHED THE HARD WAY — ${state.msSaved}ms saved`, frame.width / 2, frame.height * 0.36);
    ctx.fillStyle = dim;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText("SPACE — RETRY · ESC — QUIT", frame.width / 2, frame.height * 0.36 + 22);
  }
}
