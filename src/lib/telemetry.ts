/**
 * telemetry — real facts about this visit. Two sources, both free:
 *
 *  1. /cdn-cgi/trace — plain-text endpoint every Cloudflare-proxied
 *     domain exposes: the visitor's actual edge colo (IATA) + country.
 *     Same-origin, no third party, nothing stored. (INSTRUMENTS_PLAN §1)
 *  2. PerformanceNavigationTiming — the measured TTFB and transfer
 *     size of the very page being viewed.
 *
 * Never throws; resolves with whatever subset is truthfully known,
 * or null. On localhost/non-Cloudflare hosts, the trace simply fails
 * inside its timeout and only performance facts remain.
 */

export interface Telemetry {
  /** Visitor's Cloudflare edge colo, e.g. "LHR". */
  colo?: string;
  /** Visitor country code, e.g. "GB". */
  loc?: string;
  /** Measured time-to-first-byte of this page load, ms. */
  ttfbMs?: number;
  /** Transfer size of this document, KB (1 decimal). */
  pageKb?: number;
}

const TRACE_TIMEOUT_MS = 1500;

async function fetchTrace(): Promise<Partial<Telemetry>> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TRACE_TIMEOUT_MS);
    const res = await fetch("/cdn-cgi/trace", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return {};
    const text = await res.text();
    const out: Partial<Telemetry> = {};
    for (const line of text.split("\n")) {
      const [key, value] = line.split("=");
      if (key === "colo" && value) out.colo = value.trim().toUpperCase();
      if (key === "loc" && value) out.loc = value.trim().toUpperCase();
    }
    return out;
  } catch {
    return {};
  }
}

function readPerformance(): Partial<Telemetry> {
  try {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return {};
    const out: Partial<Telemetry> = {};
    const ttfb = nav.responseStart - nav.requestStart;
    if (ttfb > 0) out.ttfbMs = Math.round(ttfb);
    if (nav.transferSize > 0) {
      out.pageKb = Math.round((nav.transferSize / 1024) * 10) / 10;
    }
    return out;
  } catch {
    return {};
  }
}

let cached: Promise<Telemetry | null> | undefined;

export function getTelemetry(): Promise<Telemetry | null> {
  cached ??= (async () => {
    const merged = { ...readPerformance(), ...(await fetchTrace()) };
    return Object.keys(merged).length > 0 ? merged : null;
  })();
  return cached;
}
