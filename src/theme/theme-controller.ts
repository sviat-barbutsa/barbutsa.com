/**
 * theme-controller — production build of the fluid/radial/instant plan
 * (docs and showcases/css/theme-switch-showcases/
 *  FLUID_RADIAL_IMPLEMENTATION_PLAN.md + Atlas addendum).
 *
 * State primitive: html[data-theme] — one attribute; every color
 * follows via light-dark() in tokens.css. Strategies only decorate
 * the commit. Canvas engines are paused around the snapshot (A4).
 */

import { pauseAll, resumeAll } from "../lib/canvas-engine/registry";

type ResolvedTheme = "light" | "dark";
type Strategy = "fluid" | "radial" | "instant";

const STORAGE_KEY = "atlas-theme";
const SESSION_KEY = "theme-motion-radial-only";
const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: "#141412",
  light: "#ece9e2",
};

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const systemDark = matchMedia("(prefers-color-scheme: dark)");

let controls: HTMLButtonElement[] = [];
let statusEl: HTMLElement | null = null;
let transitionRunning = false;

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */

function getCurrentTheme(): ResolvedTheme {
  const set = root.dataset.theme;
  if (set === "dark" || set === "light") return set;
  return systemDark.matches ? "dark" : "light";
}

const getNextTheme = (): ResolvedTheme =>
  getCurrentTheme() === "dark" ? "light" : "dark";

function commitTheme(
  theme: ResolvedTheme,
  { persist = true }: { persist?: boolean } = {},
): void {
  root.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) meta.content = THEME_COLORS[theme];
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage may be blocked; switching must still work */
    }
  }
  for (const c of controls) {
    c.setAttribute("aria-pressed", String(theme === "dark"));
    c.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
    );
  }
}

function announce(theme: ResolvedTheme): void {
  if (statusEl) statusEl.textContent = `${theme} theme active`;
}

/* ------------------------------------------------------------------ */
/* strategy selection                                                  */
/* ------------------------------------------------------------------ */

function isDowngraded(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function downgrade(reason: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    sessionStorage.setItem("theme-motion-downgrade-reason", reason);
  } catch {
    /* optional */
  }
}

function hasLowPowerHint(): boolean {
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (
    (typeof memory === "number" && memory <= 4) ||
    (typeof cores === "number" && cores <= 4)
  );
}

function selectStrategy(): Strategy {
  if (
    reducedMotion.matches ||
    matchMedia("(forced-colors: active)").matches ||
    typeof document.startViewTransition !== "function"
  ) {
    return "instant";
  }
  if (isDowngraded() || hasLowPowerHint()) return "radial";
  return "fluid";
}

/* ------------------------------------------------------------------ */
/* fluid strategy (cached profile keyframes; Atlas durations: A4.4)    */
/* ------------------------------------------------------------------ */

interface LiquidProfile {
  id: "desktop" | "mobile";
  columns: number;
  frames: number;
  duration: number;
  amplitude: number;
}

const PROFILES: Record<LiquidProfile["id"], LiquidProfile> = {
  desktop: { id: "desktop", columns: 32, frames: 14, duration: 680, amplitude: 1 },
  mobile: { id: "mobile", columns: 20, frames: 10, duration: 620, amplitude: 0.84 },
};

const keyframeCache = new Map<LiquidProfile["id"], Keyframe[]>();

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const gaussian = (x: number, c: number, w: number): number =>
  Math.exp(-(((x - c) / w) ** 2));
const pulse = (p: number, a: number, b: number): number =>
  Math.sin(Math.PI * clamp((p - a) / (b - a), 0, 1));

function liquidPolygon(p: number, prof: LiquidProfile): string {
  const base = -7 + smoothstep(p) * 116;
  const env = Math.sin(Math.PI * p) * prof.amplitude;
  const pts = ["0% 0%", "100% 0%"];
  for (let i = prof.columns; i >= 0; i -= 1) {
    const x = i / prof.columns;
    const waves =
      Math.sin(x * Math.PI * 3.1 + p * 8.4) * 2.8 +
      Math.sin(x * Math.PI * 7.3 - p * 5.7) * 1.3 +
      Math.sin(x * Math.PI * 13 + p * 3.1) * 0.55;
    const drops =
      (gaussian(x, 0.18, 0.055) * 11 * pulse(p, 0.07, 0.61) +
        gaussian(x, 0.51, 0.038) * 17 * pulse(p, 0.18, 0.77) +
        gaussian(x, 0.82, 0.066) * 10 * pulse(p, 0.03, 0.55) -
        gaussian(x, 0.34, 0.08) * 5 * pulse(p, 0.24, 0.72)) *
      prof.amplitude;
    const y = clamp(base + waves * env + drops, 0, 112);
    pts.push(`${(x * 100).toFixed(1)}% ${y.toFixed(1)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

function getLiquidKeyframes(prof: LiquidProfile): Keyframe[] {
  const cached = keyframeCache.get(prof.id);
  if (cached) return cached;
  const frames = Array.from({ length: prof.frames }, (_, i) => {
    const p = i / (prof.frames - 1);
    return { clipPath: liquidPolygon(p, prof), offset: p };
  });
  keyframeCache.set(prof.id, frames);
  return frames;
}

const selectProfile = (): LiquidProfile =>
  window.innerWidth < 768 ? PROFILES.mobile : PROFILES.desktop;

const animateFluid = (prof: LiquidProfile): Animation =>
  root.animate(getLiquidKeyframes(prof), {
    duration: prof.duration,
    easing: "linear", // travel is eased in the math (plan §15)
    fill: "both",
    pseudoElement: "::view-transition-new(root)",
  });

/* ------------------------------------------------------------------ */
/* radial strategy                                                     */
/* ------------------------------------------------------------------ */

function animateRadial(
  event: MouseEvent | undefined,
  trigger: HTMLElement,
): Animation {
  const rect = trigger.getBoundingClientRect();
  const keyboard =
    !event || event.detail === 0 || (event.clientX === 0 && event.clientY === 0);
  const x = keyboard ? rect.left + rect.width / 2 : event.clientX;
  const y = keyboard ? rect.top + rect.height / 2 : event.clientY;
  const radius =
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ) + 2;

  return root.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: window.innerWidth < 768 ? 540 : 620,
      easing: "cubic-bezier(.16, 1, .3, 1)",
      fill: "both",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

/* ------------------------------------------------------------------ */
/* controller                                                          */
/* ------------------------------------------------------------------ */

async function requestThemeSwitch(
  event: MouseEvent | undefined,
  trigger: HTMLElement,
): Promise<void> {
  if (transitionRunning) return;

  const nextTheme = getNextTheme();
  const strategy = selectStrategy();

  if (strategy === "instant") {
    commitTheme(nextTheme);
    announce(nextTheme);
    return;
  }

  transitionRunning = true;
  root.dataset.themeMotion = "running";
  for (const c of controls) {
    c.setAttribute("aria-disabled", "true");
    c.dataset.busy = "true";
  }
  pauseAll(); // canvas engines must not draw into the snapshot (A4.1)

  try {
    const transition = document.startViewTransition!(() => {
      commitTheme(nextTheme); // synchronous, exactly once
    });
    await transition.ready;

    const animation =
      strategy === "fluid"
        ? animateFluid(selectProfile())
        : animateRadial(event, trigger);

    const results = await Promise.allSettled([
      animation.finished,
      transition.finished,
    ]);
    if (results.some((r) => r.status === "rejected")) {
      downgrade("animation-rejected");
    }
  } catch (error) {
    downgrade("transition-error");
    console.debug("Theme transition skipped", error);
  } finally {
    delete root.dataset.themeMotion;
    for (const c of controls) {
      c.setAttribute("aria-disabled", "false");
      c.dataset.busy = "false";
    }
    resumeAll(); // re-reads tokens, then resumes drawing
    transitionRunning = false;
    announce(getCurrentTheme());
  }
}

/* ------------------------------------------------------------------ */
/* wiring                                                              */
/* ------------------------------------------------------------------ */

export function initThemeController(): void {
  controls = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]"),
  );
  statusEl = document.getElementById("theme-status");

  // Sync control state to the bootstrapped theme; never write storage here.
  commitTheme(getCurrentTheme(), { persist: false });

  for (const c of controls) {
    c.addEventListener("click", (e) => void requestThemeSwitch(e, c));
  }

  // OS change applies only without an explicit stored preference (§31).
  systemDark.addEventListener("change", (e) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!stored) commitTheme(e.matches ? "dark" : "light", { persist: false });
  });

  // Multi-tab sync, without theatrics (§31).
  addEventListener("storage", (e) => {
    if (
      e.key === STORAGE_KEY &&
      (e.newValue === "light" || e.newValue === "dark")
    ) {
      commitTheme(e.newValue, { persist: false });
    }
  });
}
