import type { Telemetry } from "../telemetry-core";
import type { AtlasRoute, NormalizedTelemetry, PopCode } from "./types";

export const POP_RANGES: Record<PopCode, readonly [number, number]> = {
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

export const POP_CODES = Object.keys(POP_RANGES) as PopCode[];

const COLO_PATTERN = /^[A-Z]{3}$/;
const LOC_PATTERN = /^[A-Z]{2}$/;

export interface AtlasRouteState {
  cycle: number;
  lastCode: PopCode;
  telemetry: NormalizedTelemetry | null;
  visitorPending: boolean;
}

export function createRouteState(): AtlasRouteState {
  return {
    cycle: 0,
    lastCode: "WAW",
    telemetry: null,
    visitorPending: false,
  };
}

export function isPopCode(code: string | undefined): code is PopCode {
  return Boolean(code && Object.hasOwn(POP_RANGES, code));
}

export function normalizeTelemetry(telemetry: Telemetry | null): NormalizedTelemetry | null {
  if (!telemetry) return null;
  const normalized: NormalizedTelemetry = {};
  const colo = telemetry.colo?.trim().toUpperCase();
  const loc = telemetry.loc?.trim().toUpperCase();
  if (colo && COLO_PATTERN.test(colo)) {
    normalized.colo = colo;
    if (isPopCode(colo)) normalized.mappedColo = colo;
  }
  if (loc && LOC_PATTERN.test(loc)) normalized.loc = loc;
  if (typeof telemetry.ttfbMs === "number" && telemetry.ttfbMs > 0) {
    normalized.ttfbMs = Math.round(telemetry.ttfbMs);
  }
  if (typeof telemetry.pageKb === "number" && telemetry.pageKb > 0) {
    normalized.pageKb = Math.round(telemetry.pageKb * 10) / 10;
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function setRouteTelemetry(state: AtlasRouteState, telemetry: Telemetry | null): void {
  state.telemetry = normalizeTelemetry(telemetry);
  state.visitorPending = Boolean(state.telemetry?.mappedColo);
}

export function pickDifferent(last: string, codes: readonly string[], random: () => number = Math.random): string {
  if (codes.length === 0) return last;
  if (codes.length === 1) return codes[0] ?? last;
  const candidates = codes.filter((code) => code !== last);
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index] ?? last;
}

export function randomRange(min: number, max: number, random: () => number = Math.random): number {
  return Math.round(min + random() * (max - min));
}

export function chooseNextRoute(state: AtlasRouteState, random: () => number = Math.random): AtlasRoute {
  state.cycle += 1;
  const visitorColo = state.telemetry?.mappedColo;
  let code: PopCode;
  let telemetry: NormalizedTelemetry | undefined;

  if (state.visitorPending && visitorColo) {
    code = visitorColo;
    telemetry = state.telemetry ?? undefined;
    state.visitorPending = false;
  } else if (visitorColo && state.cycle % 3 === 0 && state.lastCode !== visitorColo) {
    code = visitorColo;
  } else {
    code = pickDifferent(state.lastCode, POP_CODES, random) as PopCode;
  }

  state.lastCode = code;
  const [lo, hi] = POP_RANGES[code];
  return {
    code,
    ttfb: telemetry?.ttfbMs ?? randomRange(lo, hi, random),
    hit: telemetry ? true : random() > 0.22,
    telemetry,
    showMeasuredLine: !telemetry && Boolean(state.telemetry) && state.cycle % 4 === 0,
  };
}

export function staticRoute(code: PopCode = "WAW", telemetry?: NormalizedTelemetry | null): AtlasRoute {
  const [lo, hi] = POP_RANGES[code];
  return {
    code,
    ttfb: telemetry?.ttfbMs ?? Math.round((lo + hi) / 2),
    hit: true,
    telemetry: telemetry ?? undefined,
    showMeasuredLine: Boolean(telemetry),
  };
}
