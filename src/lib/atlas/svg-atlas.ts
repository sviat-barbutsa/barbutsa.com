/**
 * svg-atlas — the Edge Atlas hero, ported from the approved concept
 * (docs and showcases: 04-edge-atlas). SVG geometry + CSS-token colors;
 * this module only animates and narrates it.
 *
 * Integration points kept from the site architecture:
 *  - registers with the canvas-engine registry so the theme controller
 *    pauses it around View Transition snapshots (addendum A4)
 *  - pauses when the tab is hidden OR the atlas is scrolled offscreen
 *  - prefers-reduced-motion → one static routed state, zero timers
 * Colors never live here — everything paints via var(--color-*) in CSS,
 * so theme switches recolor the scene for free.
 */

import { register, deregister } from "../canvas-engine/registry";
import type { Telemetry } from "../telemetry";

/** PoP code → plausible ttfb range in ms (by distance from origin colo). */
const POPS: Record<string, [number, number]> = {
  WAW: [16, 29],
  FRA: [27, 39],
  AMS: [30, 44],
  LHR: [33, 49],
  DXB: [68, 92],
  IAD: [86, 112],
  NRT: [118, 152],
  SIN: [128, 164],
  GRU: [132, 168],
  JNB: [138, 178],
  SYD: [158, 198],
};

const CODES = Object.keys(POPS);

const DRAW = 950;
const HOLD = 3400;
const FADE = 450;

const rand = (min: number, max: number): number =>
  Math.round(min + Math.random() * (max - min));

/** Pure: pick a code different from the previous one (unit-tested). */
export function pickDifferent(
  last: string,
  codes: readonly string[],
  pick: () => number = () => rand(0, codes.length - 1),
): string {
  if (codes.length < 2) return codes[0] ?? last;
  let code = last;
  while (code === last) code = codes[pick()]!;
  return code;
}

export interface AtlasHandle {
  destroy(): void;
  /** Feed real visit facts (INSTRUMENTS_PLAN §1): routes the visitor's
   *  actual colo next when it is on the map, weights it afterwards,
   *  and rotates a measured readout line into the cycle. */
  setTelemetry(t: Telemetry | null): void;
}

export function initAtlas(frame: HTMLElement): AtlasHandle {
  const svg = frame.querySelector<SVGSVGElement>("[data-atlas-svg]");
  const routePath = frame.querySelector<SVGPathElement>("[data-route]");
  const pulse = frame.querySelector<SVGCircleElement>("[data-pulse]");
  const readout = frame.querySelector<HTMLElement>("[data-readout-text]");
  const tip = frame.querySelector<HTMLElement>("[data-atlas-tip]");
  if (!svg || !routePath || !pulse || !readout) {
    return { destroy: () => {} };
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes = Array.from(svg.querySelectorAll<SVGGElement>(".node"));

  /* ---------- tooltips (hover + keyboard focus) ---------- */
  const showTip = (node: SVGGElement): void => {
    if (!tip) return;
    const halo = node.querySelector("circle.halo");
    if (!halo) return;
    const nb = halo.getBoundingClientRect();
    const sb = frame.getBoundingClientRect();
    tip.innerHTML = `<b>${node.dataset.city}</b> <span class="r">· ${node.dataset.role}</span>`;
    tip.style.left = `${nb.left - sb.left + nb.width / 2}px`;
    tip.style.top = `${nb.top - sb.top}px`;
    tip.classList.add("show");
    tip.setAttribute("aria-hidden", "false");
  };
  const hideTip = (): void => {
    if (!tip) return;
    tip.classList.remove("show");
    tip.setAttribute("aria-hidden", "true");
  };
  for (const n of nodes) {
    n.addEventListener("mouseenter", () => showTip(n));
    n.addEventListener("mouseleave", hideTip);
    n.addEventListener("focus", () => showTip(n));
    n.addEventListener("blur", hideTip);
  }

  /* ---------- narration ---------- */
  const setReadout = (code: string, ttfb: number, hit: boolean): void => {
    readout.innerHTML =
      `route: <b>${code}</b> → client · ttfb <b>${ttfb}ms</b> · cache: ` +
      (hit ? `<span class="hit">HIT</span>` : `<b>MISS</b>`);
  };
  const markHot = (code: string | null): void => {
    for (const n of nodes) n.classList.toggle("hot", n.dataset.code === code);
  };
  const spokeFor = (code: string): string =>
    svg.querySelector(`#sp-${code}`)?.getAttribute("d") ?? "";

  /* ---------- reduced motion: one static routed state ---------- */
  const realLine = (t: Telemetry): string => {
    const bits: string[] = [];
    if (t.colo) bits.push(`colo: <b>${t.colo}</b>`);
    if (t.ttfbMs !== undefined) bits.push(`ttfb <b>${t.ttfbMs}ms</b>`);
    if (t.pageKb !== undefined) bits.push(`page <b>${t.pageKb}kb</b>`);
    return bits.join(" · ") + ` · <span class="hit">measured</span>`;
  };

  if (reduced) {
    routePath.setAttribute("d", spokeFor("WAW"));
    routePath.classList.add("on");
    markHot("WAW");
    setReadout("WAW", 28, true);
    return {
      destroy: () => {},
      setTelemetry: (t) => {
        /* static mode: if the visitor's colo is mapped, show THAT route */
        if (t?.colo && POPS[t.colo]) {
          routePath.setAttribute("d", spokeFor(t.colo));
          markHot(t.colo);
        }
        if (t) readout.innerHTML = realLine(t);
      },
    };
  }

  /* ---------- route + pulse animation ---------- */
  let raf = 0;
  let running = false;
  let pausedExternally = false;
  let visible = true;
  let pageVisible = document.visibilityState === "visible";
  let phase: "idle" | "draw" | "hold" | "fade" = "idle";
  let t0 = 0;
  let spokeLen = 0;
  let lastCode = "WAW";
  let current: { code: string; ttfb: number; hit: boolean; real?: Telemetry } | null = null;

  /* telemetry integration (INSTRUMENTS_PLAN §1) */
  let telemetry: Telemetry | null = null;
  let visitorPending = false; /* route the real colo on the next pick */
  let cycle = 0;

  const pickNext = (): void => {
    cycle += 1;
    const visitorColo =
      telemetry?.colo && POPS[telemetry.colo] ? telemetry.colo : null;

    let code: string;
    let real: Telemetry | undefined;

    if (visitorPending && visitorColo) {
      /* first routed cycle after telemetry arrives: their actual PoP,
         their actual ttfb */
      code = visitorColo;
      real = telemetry!;
      visitorPending = false;
    } else if (visitorColo && cycle % 3 === 0 && lastCode !== visitorColo) {
      /* the visitor's colo recurs ~3x more often than chance */
      code = visitorColo;
    } else {
      code = pickDifferent(lastCode, CODES);
    }

    lastCode = code;
    const [lo, hi] = POPS[code]!;
    current = {
      code,
      ttfb: real?.ttfbMs ?? rand(lo, hi),
      hit: real ? true : Math.random() > 0.22,
      real,
    };
    routePath.setAttribute("d", spokeFor(code));
    spokeLen = routePath.getTotalLength();
    routePath.classList.add("on");
    markHot(null);
  };

  const frameFn = (now: number): void => {
    if (!running) return;
    if (!t0) t0 = now;
    let dt = now - t0;

    if (phase === "idle") {
      pickNext();
      phase = "draw";
      t0 = now;
      dt = 0;
    }

    if (phase === "draw") {
      const p = Math.min(dt / DRAW, 1);
      const e = 1 - (1 - p) ** 3; /* ease-out cubic */
      const len = e * spokeLen;
      routePath.style.strokeDasharray = `${len} ${spokeLen}`;
      const pt = routePath.getPointAtLength(len);
      pulse.setAttribute("cx", String(pt.x));
      pulse.setAttribute("cy", String(pt.y));
      pulse.style.opacity = String(p < 0.06 ? p / 0.06 : 1);
      if (p >= 1 && current) {
        phase = "hold";
        t0 = now;
        markHot(current.code);
        if (current.real) {
          readout.innerHTML =
            `route: <b>${current.code}</b> → you · ` + realLine(current.real);
        } else if (telemetry && cycle % 4 === 0) {
          /* every ~4th cycle: the measured line, even off-map */
          readout.innerHTML = realLine(telemetry);
        } else {
          setReadout(current.code, current.ttfb, current.hit);
        }
      }
    } else if (phase === "hold") {
      pulse.style.opacity = String(Math.max(0, 1 - dt / 300));
      if (dt >= HOLD) {
        phase = "fade";
        t0 = now;
        routePath.classList.remove("on");
      }
    } else if (phase === "fade") {
      if (dt >= FADE) {
        phase = "idle";
        t0 = 0;
      }
    }
    raf = requestAnimationFrame(frameFn);
  };

  const sync = (): void => {
    const should = !pausedExternally && visible && pageVisible;
    if (should && !running) {
      running = true;
      t0 = 0; /* don't integrate the paused gap */
      raf = requestAnimationFrame(frameFn);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const onVisibility = (): void => {
    pageVisible = document.visibilityState === "visible";
    sync();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? true;
      sync();
    },
    { rootMargin: "64px" },
  );
  io.observe(frame);

  /* Theme-controller handshake: same contract as canvas engines. */
  const pausable = {
    pause: (): void => {
      pausedExternally = true;
      sync();
    },
    resume: (): void => {
      pausedExternally = false;
      sync();
    },
    refreshTheme: (): void => {
      /* colors are CSS vars — nothing to do */
    },
  };
  register(pausable);

  sync();

  return {
    destroy: (): void => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      deregister(pausable);
    },
    setTelemetry: (t): void => {
      telemetry = t;
      visitorPending = Boolean(t?.colo && POPS[t.colo]);
    },
  };
}
