/**
 * nav-line - the sliding hairline under the site nav. One ::after on
 * the .site-nav ul, positioned by two custom properties; this module
 * only measures links and updates the props, the motion itself stays
 * in CSS (where reduced-motion can disable it).
 *
 * Moves on hover/focus, settles back on the current page's link.
 * Without JS the static aria-current underline (site-chrome.css)
 * still renders, so this is progressive enhancement only.
 */

let cleanupCurrent: (() => void) | null = null;

export function initNavLine(): () => void {
  cleanupCurrent?.();
  const nav = document.querySelector<HTMLElement>(".site-nav");
  if (!nav) return () => {};
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
  if (!links.length) return () => {};
  const removers: Array<() => void> = [];

  const home = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');

  const place = (el: HTMLAnchorElement | null): void => {
    if (!el) {
      /* no active link on this page (404 etc.) - line stays collapsed */
      nav.style.setProperty("--line-w", "0px");
      return;
    }
    /* offsetLeft is relative to the positioned ul, so the line tracks
       links correctly even while the nav is scrolled horizontally */
    nav.style.setProperty("--line-x", `${el.offsetLeft}px`);
    nav.style.setProperty("--line-w", `${el.offsetWidth}px`);
  };

  place(home);
  /* enable transitions only after the first placement, otherwise the
     line flies in from x:0 on page load */
  const readyFrame = requestAnimationFrame(() => {
    nav.dataset.lineReady = "";
  });

  for (const a of links) {
    const onPlace = (): void => place(a);
    a.addEventListener("mouseenter", onPlace);
    a.addEventListener("focus", onPlace);
    removers.push(() => {
      a.removeEventListener("mouseenter", onPlace);
      a.removeEventListener("focus", onPlace);
    });
  }
  const onLeave = (): void => place(home);
  const onFocusOut = (event: FocusEvent): void => {
    if (!nav.contains(event.relatedTarget as Node | null)) place(home);
  };
  const onResize = (): void => place(home);
  nav.addEventListener("mouseleave", onLeave);
  nav.addEventListener("focusout", onFocusOut);
  addEventListener("resize", onResize, { passive: true });
  removers.push(() => {
    nav.removeEventListener("mouseleave", onLeave);
    nav.removeEventListener("focusout", onFocusOut);
    removeEventListener("resize", onResize);
  });

  const cleanup = (): void => {
    cancelAnimationFrame(readyFrame);
    removers.forEach((remove) => remove());
    if (cleanupCurrent === cleanup) cleanupCurrent = null;
  };
  cleanupCurrent = cleanup;
  return cleanup;
}
