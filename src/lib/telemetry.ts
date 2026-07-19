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

import { isLocalHostName, parseTrace, readNavigationTelemetry, type Telemetry } from "./telemetry-core";

export type { Telemetry } from "./telemetry-core";

const TRACE_TIMEOUT_MS = 1500;

function isLocalHost(): boolean {
  return isLocalHostName(location.hostname);
}

async function fetchTrace(): Promise<Partial<Telemetry>> {
  /* /cdn-cgi/trace only exists behind Cloudflare — skip the request
     entirely in local dev so the console stays clean. */
  if (isLocalHost()) return {};
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TRACE_TIMEOUT_MS);
  try {
    const res = await fetch("/cdn-cgi/trace", { signal: ctrl.signal });
    if (!res.ok) return {};
    return parseTrace(await res.text());
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

function readPerformance(): Partial<Telemetry> {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return readNavigationTelemetry(nav);
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
