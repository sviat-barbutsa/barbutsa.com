/**
 * nav-line — the sliding hairline under the site nav. One ::after on
 * the .site-nav ul, positioned by two custom properties; this module
 * only measures links and moves the props, so the motion itself stays
 * in CSS (where reduced-motion can kill it wholesale).
 *
 * Event-driven by the site's motion rules: it moves on hover/focus and
 * settles back on the current page's link — no ambient work. Without
 * JS the static aria-current underline (components.css) still renders,
 * so this is pure progressive enhancement.
 */

export function initNavLine(): void {
  const nav = document.querySelector<HTMLElement>(".site-nav");
  if (!nav) return;
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
  if (!links.length) return;

  const home = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');

  const place = (el: HTMLAnchorElement | null): void => {
    if (!el) {
      /* no active link on this page (404 etc.) — line stays collapsed */
      nav.style.setProperty("--line-w", "0px");
      return;
    }
    /* offsetLeft is relative to the positioned ul, so the line tracks
       links correctly even while the nav is scrolled horizontally */
    nav.style.setProperty("--line-x", `${el.offsetLeft}px`);
    nav.style.setProperty("--line-w", `${el.offsetWidth}px`);
  };

  place(home);
  /* enable transitions only after first placement — the line must not
     fly in from x:0 on page load */
  requestAnimationFrame(() => {
    nav.dataset.lineReady = "";
  });

  for (const a of links) {
    a.addEventListener("mouseenter", () => place(a));
    a.addEventListener("focus", () => place(a));
  }
  nav.addEventListener("mouseleave", () => place(home));
  nav.addEventListener("focusout", (e) => {
    if (!nav.contains(e.relatedTarget as Node | null)) place(home);
  });
  addEventListener("resize", () => place(home), { passive: true });
}
