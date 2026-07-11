/**
 * canvas-engine/registry — module-level registry of live engines.
 *
 * Exists for exactly one integration: the theme controller pauses all
 * canvas work before startViewTransition() snapshots the page, and
 * resumes + re-themes it after (theme plan §29 / Atlas addendum A4).
 * Engines self-register on start and deregister on destroy.
 */

interface Pausable {
  pause(): void;
  resume(): void;
  refreshTheme(): void;
}

const engines = new Set<Pausable>();

export function register(engine: Pausable): void {
  engines.add(engine);
}

export function deregister(engine: Pausable): void {
  engines.delete(engine);
}

export function pauseAll(): void {
  for (const e of engines) e.pause();
}

export function resumeAll(): void {
  for (const e of engines) {
    e.refreshTheme();
    e.resume();
  }
}
