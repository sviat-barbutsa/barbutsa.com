/**
 * typer — terminal-style typewriter for the hero doctrine line.
 *
 * Types a phrase with slight human jitter, holds, erases faster,
 * blinks idle, moves to the next. Same behavioral contracts as every
 * animation on this site:
 *  - prefers-reduced-motion → one static phrase, zero timers
 *  - pauses when the tab is hidden or the element leaves the viewport
 *  - registers with the pause registry so theme-switch snapshots
 *    never capture a mid-character frame
 *  - no layout shift: the container reserves its height in CSS
 */

import { createActivityGate } from "./runtime/activity-gate";
import { registerPausable } from "./runtime/pause-registry";

export interface TyperOptions {
  /** ms per typed character (± jitter). */
  typeMs?: number;
  jitterMs?: number;
  /** ms per erased character. */
  eraseMs?: number;
  /** ms the full phrase stays on screen. */
  holdMs?: number;
  /** ms of empty-line blink between phrases. */
  blinkMs?: number;
  /** false = type the phrase once and STOP (no erase loop). */
  loop?: boolean;
  /** fires when a loop:false phrase has fully landed. */
  onDone?: () => void;
}

const DEFAULTS: Required<Omit<TyperOptions, "onDone">> = {
  typeMs: 46,
  jitterMs: 34,
  eraseMs: 22,
  holdMs: 3200,
  blinkMs: 900,
  loop: true,
};

export interface TyperHandle {
  destroy(): void;
}

/** Ambient rotation controls per element — lets features like the
 *  shell suspend the doctrine rotation and restart it later without
 *  knowing phrases/options (Typewriter.astro registers them). */
export const ambientControls = new WeakMap<HTMLElement, { stop(): void; start(): void }>();

export function initTyper(el: HTMLElement, phrases: readonly string[], options: TyperOptions = {}): TyperHandle {
  if (phrases.length === 0) return { destroy: () => {} };
  const {
    typeMs: TYPE_MS,
    jitterMs: JITTER_MS,
    eraseMs: ERASE_MS,
    holdMs: HOLD_MS,
    blinkMs: BLINK_MS,
    loop: LOOP,
  } = { ...DEFAULTS, ...options };
  const onDone = options.onDone;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    el.textContent = phrases[0]!;
    return { destroy: () => {} };
  }

  let index = Math.floor(Math.random() * phrases.length);
  let pos = 0;
  let phase: "type" | "hold" | "erase" | "blink" = "type";
  let timer = 0;
  let finished = false;
  let active = true;
  let running = false;

  const phrase = (): string => phrases[index % phrases.length]!;

  const step = (): void => {
    if (!running) return;
    let delay: number;

    if (phase === "type") {
      pos += 1;
      el.textContent = phrase().slice(0, pos);
      if (pos >= phrase().length) {
        if (!LOOP) {
          /* once-mode: the phrase stays; no erase, no timers. */
          finished = true;
          running = false;
          onDone?.();
          return;
        }
        phase = "hold";
        delay = HOLD_MS;
      } else {
        delay = TYPE_MS + Math.random() * JITTER_MS;
        /* micro-pause after spaces reads as word rhythm */
        if (phrase()[pos - 1] === " ") delay += 40;
      }
    } else if (phase === "hold") {
      phase = "erase";
      delay = ERASE_MS;
    } else if (phase === "erase") {
      pos -= 1;
      el.textContent = phrase().slice(0, pos);
      if (pos <= 0) {
        phase = "blink";
        delay = BLINK_MS;
      } else {
        delay = ERASE_MS;
      }
    } else {
      index += 1;
      phase = "type";
      pos = 0;
      delay = TYPE_MS;
    }

    timer = window.setTimeout(step, delay);
  };

  const sync = (): void => {
    const should = active && !finished;
    if (should && !running) {
      running = true;
      timer = window.setTimeout(step, 200);
    } else if (!should && running) {
      running = false;
      clearTimeout(timer);
    }
  };

  const activity = createActivityGate({
    target: el,
    rootMargin: "32px",
    onActiveChange: (next) => {
      active = next;
      sync();
    },
  });

  const pausable = {
    pause: () => activity.pause(),
    resume: () => activity.resume(),
    refreshTheme: (): void => {},
  };
  const unregister = registerPausable(pausable);

  sync();

  return {
    destroy: (): void => {
      running = false;
      clearTimeout(timer);
      activity.destroy();
      unregister();
    },
  };
}
