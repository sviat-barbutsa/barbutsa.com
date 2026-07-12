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

import { register, deregister } from "./canvas-engine/registry";

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
}

const DEFAULTS: Required<TyperOptions> = {
  typeMs: 46,
  jitterMs: 34,
  eraseMs: 22,
  holdMs: 3200,
  blinkMs: 900,
};

export interface TyperHandle {
  destroy(): void;
}

/** Ambient rotation controls per element — lets features like the
 *  shell suspend the doctrine rotation and restart it later without
 *  knowing phrases/options (Typewriter.astro registers them). */
export const ambientControls = new WeakMap<
  HTMLElement,
  { stop(): void; start(): void }
>();

export function initTyper(
  el: HTMLElement,
  phrases: readonly string[],
  options: TyperOptions = {},
): TyperHandle {
  if (phrases.length === 0) return { destroy: () => {} };
  const { typeMs: TYPE_MS, jitterMs: JITTER_MS, eraseMs: ERASE_MS, holdMs: HOLD_MS, blinkMs: BLINK_MS } = { ...DEFAULTS, ...options };

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    el.textContent = phrases[0]!;
    return { destroy: () => {} };
  }

  let index = Math.floor(Math.random() * phrases.length);
  let pos = 0;
  let phase: "type" | "hold" | "erase" | "blink" = "type";
  let timer = 0;
  let pausedExternally = false;
  let visible = true;
  let pageVisible = document.visibilityState === "visible";
  let running = false;

  const phrase = (): string => phrases[index % phrases.length]!;

  const step = (): void => {
    if (!running) return;
    let delay: number;

    if (phase === "type") {
      pos += 1;
      el.textContent = phrase().slice(0, pos);
      if (pos >= phrase().length) {
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
    const should = !pausedExternally && visible && pageVisible;
    if (should && !running) {
      running = true;
      timer = window.setTimeout(step, 200);
    } else if (!should && running) {
      running = false;
      clearTimeout(timer);
    }
  };

  const onVisibility = (): void => {
    pageVisible = document.visibilityState === "visible";
    sync();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? true;
      sync();
    },
    { rootMargin: "32px" },
  );
  io.observe(el);

  const pausable = {
    pause: (): void => {
      pausedExternally = true;
      sync();
    },
    resume: (): void => {
      pausedExternally = false;
      sync();
    },
    refreshTheme: (): void => {},
  };
  register(pausable);

  sync();

  return {
    destroy: (): void => {
      running = false;
      clearTimeout(timer);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      deregister(pausable);
    },
  };
}
