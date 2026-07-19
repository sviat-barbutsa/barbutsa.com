import type { Engine } from "../canvas-engine/engine";
import { createGame, type PacketRunner } from "./game";
import { MenuSelection } from "./menu-selection";
import { closeSfx, isMuted, sfx, toggleMute } from "./sfx";
import { createFlamencoView, getVisibleFocusables, type FlamencoElements } from "./view";

let openNow = false;

const SCROLL_KEYS = new Set([
  " ",
  "Spacebar",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
]);

class FlamencoSession {
  private elements: FlamencoElements = createFlamencoView();
  private engine: Engine;
  private runner: PacketRunner;
  private selection = new MenuSelection(this.elements.menuRing);
  private paused = false;
  private pausedBeforeClick = false;
  private closed = false;

  constructor(private restoreFocus: HTMLElement | null) {
    let game: ReturnType<typeof createGame>;
    try {
      game = createGame(this.elements.canvas, {
        onJump: () => sfx.jump(),
        onClear: () => sfx.clear(),
        onDie: () => sfx.die(),
        onMilestone: () => sfx.milestone(),
      });
    } catch (error) {
      this.elements.overlay.remove();
      throw error;
    }
    this.engine = game.engine;
    this.runner = game.runner;
    this.syncSound();
    this.wireControls();
    this.elements.canvas.focus();
  }

  private syncSound(): void {
    this.elements.soundBtn.textContent = isMuted() ? "SND OFF" : "SND ON";
    this.elements.soundBtn.setAttribute("aria-pressed", String(!isMuted()));
  }

  private pause(focusMenu = false): void {
    if (this.paused || this.runner.phase !== "running") return;
    this.paused = true;
    this.engine.pause();
    this.elements.veil.hidden = false;
    this.selection.select(0, focusMenu);
  }

  private resume = (): void => {
    if (!this.paused) return;
    this.paused = false;
    this.elements.veil.hidden = true;
    this.selection.clear();
    this.engine.resume();
    this.elements.canvas.focus();
  };

  private quit = (): void => {
    if (this.closed) return;
    this.closed = true;
    closeSfx();
    this.engine.destroy();
    this.elements.overlay.remove();
    document.removeEventListener("keydown", this.onKey, true);
    openNow = false;
    if (this.restoreFocus?.isConnected) this.restoreFocus.focus();
  };

  private containTab(event: KeyboardEvent): void {
    const focusables = getVisibleFocusables(this.elements.panel);
    if (focusables.length === 0) {
      event.preventDefault();
      this.elements.canvas.focus();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement;
    if (!this.elements.panel.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private onKey = (event: KeyboardEvent): void => {
    if (event.key === "Tab") {
      this.containTab(event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!this.paused && this.runner.phase === "running") this.pause(true);
      else this.quit();
      return;
    }
    if (this.paused) {
      this.handlePausedKey(event);
      return;
    }
    if ((event.target as HTMLElement | null)?.tagName === "BUTTON") return;
    if (SCROLL_KEYS.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (event.key === " " || event.key === "Spacebar" || event.key === "ArrowUp") this.runner.jump();
  };

  private handlePausedKey(event: KeyboardEvent): void {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      this.selection.move(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      this.selection.move(-1);
    } else if ((event.target as HTMLElement | null)?.tagName === "BUTTON") {
      return;
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.selection.activate();
    } else if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      this.resume();
    } else if (SCROLL_KEYS.has(event.key)) {
      event.preventDefault();
    }
  }

  private wireControls(): void {
    this.elements.soundBtn.addEventListener("click", () => {
      toggleMute();
      this.syncSound();
    });
    this.elements.canvas.addEventListener("blur", () => this.pause());
    this.elements.canvas.addEventListener("pointerdown", () => {
      if (this.paused) this.resume();
      else this.runner.jump();
    });
    this.elements.overlay.querySelector("[data-fl-continue]")?.addEventListener("click", this.resume);
    this.elements.overlay.querySelectorAll("[data-fl-quit]").forEach((button) => {
      button.addEventListener("click", this.quit);
    });
    this.elements.menuRing.forEach((button, index) => {
      button.addEventListener("focus", () => {
        if (this.paused) this.selection.select(index, false);
      });
    });
    this.elements.overlay.addEventListener("pointerdown", (event) => {
      if (event.target === this.elements.overlay) this.pausedBeforeClick = this.paused;
    });
    this.elements.overlay.addEventListener("click", (event) => {
      if (event.target !== this.elements.overlay || this.runner.phase === "ready") return;
      if (!this.pausedBeforeClick && this.runner.phase === "running") this.pause(true);
      else this.quit();
    });
    document.addEventListener("keydown", this.onKey, true);
  }
}

export function openFlamenco(restoreFocus: HTMLElement | null = null): void {
  if (openNow) return;
  openNow = true;
  try {
    new FlamencoSession(restoreFocus);
  } catch (error) {
    openNow = false;
    throw error;
  }
}
