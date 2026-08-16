/**
 * xray - overlay mode where the page shows its own layout structure.
 * One attribute (html[data-xray]) toggles it; CSS draws the overlay
 * (outlines only, they don't affect layout). Session-scoped so the
 * diagnostic mode doesn't survive to the next visit.
 */

const KEY = "atlas-xray";
let cleanupCurrent: (() => void) | null = null;

function apply(on: boolean): void {
  document.documentElement.toggleAttribute("data-xray", on);
  for (const b of document.querySelectorAll<HTMLElement>("[data-xray-toggle]")) {
    b.setAttribute("aria-pressed", String(on));
  }
  try {
    sessionStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* optional */
  }
}

function isXrayOn(): boolean {
  return document.documentElement.hasAttribute("data-xray");
}

export function toggleXray(): boolean {
  const next = !isXrayOn();
  apply(next);
  return next;
}

const PIN_KEY = "atlas-xray-pin";

function applyPin(edge: "top" | "bottom"): void {
  const legend = document.querySelector<HTMLElement>(".xray-legend");
  if (legend) legend.dataset.pin = edge;
  for (const b of document.querySelectorAll<HTMLElement>("[data-xray-pin]")) {
    b.textContent = edge === "bottom" ? "↑ PIN TOP" : "↓ PIN BOTTOM";
    b.setAttribute("aria-label", edge === "bottom" ? "Move legend to the top edge" : "Move legend to the bottom edge");
  }
  try {
    sessionStorage.setItem(PIN_KEY, edge);
  } catch {
    /* optional */
  }
}

export function initXray(): () => void {
  cleanupCurrent?.();
  const removers: Array<() => void> = [];

  /* restore within the session (e.g. after page navigation) */
  try {
    if (sessionStorage.getItem(KEY) === "1") apply(true);
  } catch {
    /* optional */
  }
  for (const b of document.querySelectorAll<HTMLElement>("[data-xray-toggle]")) {
    const onClick = (): void => {
      toggleXray();
    };
    b.addEventListener("click", onClick);
    removers.push(() => b.removeEventListener("click", onClick));
  }

  /* pin: the legend is fixed and can cover content (e.g. the footer);
     one click moves it to the opposite edge */
  let edge: "top" | "bottom" = "bottom";
  try {
    if (sessionStorage.getItem(PIN_KEY) === "top") edge = "top";
  } catch {
    /* optional */
  }
  applyPin(edge);
  for (const b of document.querySelectorAll<HTMLElement>("[data-xray-pin]")) {
    const onClick = (): void => {
      edge = edge === "bottom" ? "top" : "bottom";
      applyPin(edge);
    };
    b.addEventListener("click", onClick);
    removers.push(() => b.removeEventListener("click", onClick));
  }

  const cleanup = (): void => {
    removers.forEach((remove) => remove());
    if (cleanupCurrent === cleanup) cleanupCurrent = null;
  };
  cleanupCurrent = cleanup;
  return cleanup;
}
