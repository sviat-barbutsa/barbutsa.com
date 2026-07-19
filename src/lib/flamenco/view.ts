export interface FlamencoElements {
  overlay: HTMLElement;
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  veil: HTMLElement;
  soundBtn: HTMLButtonElement;
  menuRing: HTMLButtonElement[];
}

const OVERLAY_MARKUP = `
  <div class="flamenco-panel" data-fl-dialog role="dialog" aria-modal="true" aria-label="Flamenco — the packet runner">
    <p class="fl-meta">
      <span>.flamenco / packet-runner v1</span>
      <button type="button" class="xl-close" data-fl-quit aria-label="Quit game">×&nbsp;ESC</button>
    </p>
    <div class="fl-stage">
      <canvas class="fl-canvas" tabindex="0" aria-label="Packet runner game canvas"></canvas>
      <div class="fl-pause" data-fl-pause hidden>
        <p class="fl-pause-label">PAUSED</p>
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

export function createFlamencoView(): FlamencoElements {
  const overlay = document.createElement("div");
  overlay.className = "flamenco-overlay";
  overlay.innerHTML = OVERLAY_MARKUP;
  document.body.appendChild(overlay);

  const panel = overlay.querySelector<HTMLElement>("[data-fl-dialog]");
  const canvas = overlay.querySelector<HTMLCanvasElement>(".fl-canvas");
  const veil = overlay.querySelector<HTMLElement>("[data-fl-pause]");
  const soundBtn = overlay.querySelector<HTMLButtonElement>("[data-fl-sound]");
  if (!panel || !canvas || !veil || !soundBtn) {
    overlay.remove();
    throw new Error("flamenco: invalid overlay");
  }
  const menuRing = [
    overlay.querySelector<HTMLButtonElement>("[data-fl-continue]"),
    overlay.querySelector<HTMLButtonElement>("[data-fl-pause] [data-fl-quit]"),
    soundBtn,
  ].filter((button): button is HTMLButtonElement => Boolean(button));
  return { overlay, panel, canvas, veil, soundBtn, menuRing };
}

export function getVisibleFocusables(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), canvas[tabindex="0"]')).filter(
    (element) => !element.closest("[hidden]") && element.getClientRects().length > 0,
  );
}
