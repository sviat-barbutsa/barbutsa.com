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
}
