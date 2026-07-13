/**
 * flamenco — the easter egg's shell (pun intended). Builds the overlay,
 * wires the keys, and quits cleanly. Loaded ONLY via dynamic import
 * from the `flamenco` shell command — normal visitors never pay a byte.
 *
 * Keys are captured exclusively while the overlay is open (the whole
 * reason this lives behind a shell command instead of a global combo).
 */

import { createGame } from "./game";
import { sfx, isMuted, toggleMute, closeSfx } from "./sfx";

let openNow = false;

export function openFlamenco(): void {
  if (openNow) return;
  openNow = true;

  const overlay = document.createElement("div");
  overlay.className = "flamenco-overlay";
  overlay.innerHTML = `
    <div class="flamenco-panel" role="dialog" aria-modal="true" aria-label="Flamenco — the packet runner">
      <p class="fl-meta">
        <span>.flamenco / packet-runner v1</span>
        <button type="button" class="xl-close" data-fl-quit aria-label="Quit game">×&nbsp;ESC</button>
      </p>
      <div class="fl-stage">
        <canvas class="fl-canvas" tabindex="0" aria-label="Packet runner game canvas"></canvas>
        <div class="fl-pause" data-fl-pause hidden>
          <p class="fl-pause-label">PAUSED</p>
          <!-- the ▸ selection cursor is CSS (:focus::before) — it follows
               the focused button, so arrow-key navigation moves it free -->
          <p class="fl-pause-actions">
            <button type="button" class="xl-close fl-menu-btn" data-fl-continue>CONTINUE</button>
            <button type="button" class="xl-close fl-menu-btn" data-fl-quit>QUIT</button>
          </p>
        </div>
      </div>
      <p class="fl-foot">
        <span>SPACE / ↑ / TAP — JUMP</span>
        <button type="button" class="xl-close" data-fl-sound aria-pressed="true">SND ON</button>
        <span>YOU FOUND THE HIDDEN FILE. OLÉ.</span>
      </p>
    </div>`;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector<HTMLCanvasElement>(".fl-canvas")!;
  const { engine, runner } = createGame(canvas, {
    onJump: () => sfx.jump(),
    onClear: () => sfx.clear(),
    onDie: () => sfx.die(),
    onMilestone: () => sfx.milestone(),
  });

  const soundBtn = overlay.querySelector<HTMLButtonElement>("[data-fl-sound]")!;
  const syncSound = (): void => {
    soundBtn.textContent = isMuted() ? "SND OFF" : "SND ON";
    soundBtn.setAttribute("aria-pressed", String(!isMuted()));
  };
  syncSound();
  soundBtn.addEventListener("click", () => {
    toggleMute();
    syncSound();
  });

  /* ---- pause: the game NEVER runs while the player is elsewhere ----
     Tabbing to the sound button, clicking any control — anything that
     takes focus off the canvas freezes the engine and shows the veil.
     CONTINUE (or Space/↑/tap outside a button) resumes. */
  const veil = overlay.querySelector<HTMLElement>("[data-fl-pause]")!;
  let paused = false;
  const pause = (focusMenu = false): void => {
    if (paused || runner.phase !== "running") return;
    paused = true;
    engine.pause();
    veil.hidden = false;
    /* selection ALWAYS starts on CONTINUE so the ▸ cursor is visible;
       blur-pause must not steal the user's focus target, so focus only
       moves on an ESC-pause. */
    select(0, focusMenu);
  };
  const resume = (): void => {
    if (!paused) return;
    paused = false;
    veil.hidden = true;
    clearSelection(); /* SND sits outside the veil — don't leave a ▸ there */
    engine.resume();
    canvas.focus();
  };
  canvas.addEventListener("blur", () => pause());
  overlay.querySelector("[data-fl-continue]")?.addEventListener("click", resume);

  /* pause-menu selection ring — arrows move, Enter/Space activates.
     Selection is STATE (data-fl-selected), not merely :focus: a blur-
     pause leaves focus elsewhere, and the ▸ cursor must still sit on
     exactly one button whenever the menu is up. Focus follows when we
     own it; focus arriving by Tab drags the selection along instead. */
  const menuRing = [
    overlay.querySelector<HTMLButtonElement>("[data-fl-continue]"),
    overlay.querySelector<HTMLButtonElement>("[data-fl-pause] [data-fl-quit]"),
    soundBtn,
  ].filter((b): b is HTMLButtonElement => Boolean(b));

  let selected = -1;
  const select = (idx: number, focus = true): void => {
    selected = ((idx % menuRing.length) + menuRing.length) % menuRing.length;
    menuRing.forEach((b, i) => {
      if (i === selected) b.setAttribute("data-fl-selected", "");
      else b.removeAttribute("data-fl-selected");
    });
    if (focus) menuRing[selected]?.focus();
  };
  const clearSelection = (): void => {
    selected = -1;
    for (const b of menuRing) b.removeAttribute("data-fl-selected");
  };
  const moveSelection = (dir: 1 | -1): void => {
    select(selected === -1 ? (dir === 1 ? 0 : menuRing.length - 1) : selected + dir);
  };
  menuRing.forEach((b, i) => {
    b.addEventListener("focus", () => {
      if (paused) select(i, false);
    });
  });

  const quit = (): void => {
    closeSfx();
    engine.destroy();
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
    openNow = false;
  };

  const SCROLL_KEYS = new Set([
    " ", "Spacebar", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "PageUp", "PageDown", "Home", "End",
  ]);

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      /* Game convention: ESC is a pause menu, not an eject seat.
         Mid-run it pauses (run preserved, one key from resuming);
         with nothing to lose — paused, ready, or dead — it quits. */
      if (!paused && runner.phase === "running") pause(true);
      else quit();
      return;
    }

    if (paused) {
      /* arrows move the menu selection, wrapping — console-style */
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        moveSelection(1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        moveSelection(-1);
        return;
      }
      /* let Enter/Space ACTIVATE the focused control (sound, continue) */
      if ((e.target as HTMLElement | null)?.tagName === "BUTTON") return;
      /* focus is elsewhere (blur-pause): Enter fires the ▸-selected one */
      if (e.key === "Enter" && selected !== -1) {
        e.preventDefault();
        e.stopPropagation();
        menuRing[selected]?.click();
        return;
      }
      if (SCROLL_KEYS.has(e.key)) e.preventDefault(); // page must not move
      if (e.key === " " || e.key === "Spacebar") resume();
      return;
    }

    if (SCROLL_KEYS.has(e.key)) {
      e.preventDefault(); // the page NEVER scrolls under the game
      e.stopPropagation();
    }
    if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") {
      runner.jump();
    }
  };

  /* capture phase: the game owns these keys while open, nothing else */
  document.addEventListener("keydown", onKey, true);
  canvas.addEventListener("pointerdown", () => {
    if (paused) {
      resume();
      return;
    }
    runner.jump();
  });
  for (const b of overlay.querySelectorAll("[data-fl-quit]")) {
    b.addEventListener("click", quit);
  }
  /* Outside-click etiquette — same as ESC — with one subtlety: the
     click's own mousedown blurs the canvas, which pauses BEFORE the
     click event lands. Judge by the state captured at pointerdown, or
     an accidental outside click would fall through to quit. */
  let pausedBeforeClick = false;
  overlay.addEventListener("pointerdown", (e) => {
    if (e.target === overlay) pausedBeforeClick = paused;
  });
  overlay.addEventListener("click", (e) => {
    if (e.target !== overlay) return;
    /* ready screen: ignore outside clicks entirely — re-summoning the
       game costs retyping a command, so a misclick must not eject.
       Closing from here is ESC or the × button, both deliberate. */
    if (runner.phase === "ready") return;
    if (!pausedBeforeClick && runner.phase === "running") {
      pause(true); /* no-op if the blur already paused */
      if (paused) select(0); /* either way: cursor + focus on CONTINUE */
    } else {
      quit(); /* paused or dead: a second outside click is deliberate */
    }
  });

  canvas.focus();
}
