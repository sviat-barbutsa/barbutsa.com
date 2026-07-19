import { getTelemetry } from "../telemetry";

export interface StatusBarHandle {
  destroy(): void;
}

function sectionText(target: Element): string {
  const kick = target.querySelector(".kick");
  return (kick?.textContent ?? document.title).replace(/\s+/g, " ").trim().toLowerCase();
}

function observeSection(sectionEl: HTMLElement): () => void {
  const regions = Array.from(document.querySelectorAll<HTMLElement>(".region"));
  if (!("IntersectionObserver" in window) || regions.length === 0) return () => {};
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        sectionEl.textContent = `§ ${sectionText(entry.target).slice(0, 36)}`;
      }
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  regions.forEach((region) => observer.observe(region));
  return () => observer.disconnect();
}

function observeScroll(scrollEl: HTMLElement): () => void {
  let ticking = false;
  let raf = 0;
  const update = (): void => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? Math.round((scrollY / max) * 100) : 0;
    scrollEl.textContent = `${pct}%`;
    ticking = false;
  };
  const onScroll = (): void => {
    if (ticking) return;
    ticking = true;
    raf = requestAnimationFrame(update);
  };
  addEventListener("scroll", onScroll, { passive: true });
  update();
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("scroll", onScroll);
  };
}

function observeTheme(themeEl: HTMLElement): () => void {
  const readTheme = (): void => {
    themeEl.textContent =
      document.documentElement.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  };
  const observer = new MutationObserver(readTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  readTheme();
  return () => observer.disconnect();
}

function startClock(clockEl: HTMLElement): () => void {
  const tick = (): void => {
    const date = new Date();
    clockEl.textContent = `utc ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(
      2,
      "0",
    )}`;
  };
  tick();
  const timer = window.setInterval(tick, 30_000);
  return () => clearInterval(timer);
}

function loadTelemetry(coloEl: HTMLElement): () => void {
  let disposed = false;
  let separator: HTMLElement | null = null;
  void getTelemetry().then((telemetry) => {
    if (disposed) return;
    if (!telemetry?.colo && telemetry?.ttfbMs === undefined) return;
    const bits = [telemetry.colo, telemetry.ttfbMs !== undefined ? `${telemetry.ttfbMs}ms` : null]
      .filter(Boolean)
      .join(" · ");
    coloEl.textContent = bits;
    coloEl.hidden = false;
    separator = document.createElement("span");
    separator.className = "sb-sep";
    separator.textContent = "·";
    coloEl.after(separator);
  });
  return () => {
    disposed = true;
    separator?.remove();
  };
}

export function initStatusBar(bar: HTMLElement): StatusBarHandle {
  const query = (selector: string) => bar.querySelector<HTMLElement>(selector);
  const removers: Array<() => void> = [];
  const sectionEl = query("[data-sb-section]");
  const scrollEl = query("[data-sb-scroll]");
  const coloEl = query("[data-sb-colo]");
  const themeEl = query("[data-sb-theme]");
  const clockEl = query("[data-sb-clock]");

  if (sectionEl) removers.push(observeSection(sectionEl));
  if (scrollEl) removers.push(observeScroll(scrollEl));
  if (themeEl) removers.push(observeTheme(themeEl));
  if (clockEl) removers.push(startClock(clockEl));
  if (coloEl) removers.push(loadTelemetry(coloEl));

  return {
    destroy: () => removers.forEach((remove) => remove()),
  };
}
