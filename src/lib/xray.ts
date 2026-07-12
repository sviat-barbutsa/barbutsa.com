/**
 * xray — the site documents its own architecture (INSTRUMENTS_PLAN §2).
 * One attribute (html[data-xray]) switches it; CSS draws the overlay
 * (outlines only — they never affect layout). Session-scoped: a
 * diagnostic mode should not survive to the next visit.
 */

const KEY = "atlas-xray";

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

export function isXrayOn(): boolean {
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
    b.setAttribute(
      "aria-label",
      edge === "bottom" ? "Move legend to the top edge" : "Move legend to the bottom edge",
    );
  }
  try {
    sessionStorage.setItem(PIN_KEY, edge);
  } catch {
    /* optional */
  }
}

export function initXray(): void {
  /* restore within the session (e.g. after page navigation) */
  try {
    if (sessionStorage.getItem(KEY) === "1") apply(true);
  } catch {
    /* optional */
  }
  for (const b of document.querySelectorAll<HTMLElement>("[data-xray-toggle]")) {
    b.addEventListener("click", () => toggleXray());
  }

  /* pin: the legend is fixed and can cover content (e.g. the footer) —
     one click moves it to the opposite edge so nothing is uninspectable. */
  let edge: "top" | "bottom" = "bottom";
  try {
    if (sessionStorage.getItem(PIN_KEY) === "top") edge = "top";
  } catch {
    /* optional */
  }
  applyPin(edge);
  for (const b of document.querySelectorAll<HTMLElement>("[data-xray-pin]")) {
    b.addEventListener("click", () => {
      edge = edge === "bottom" ? "top" : "bottom";
      applyPin(edge);
    });
  }
}
