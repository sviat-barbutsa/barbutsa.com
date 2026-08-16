/**
 * telemetry - facts about the current visit. Two sources:
 *
 *  1. /cdn-cgi/trace - plain-text endpoint every Cloudflare-proxied
 *     domain exposes: the visitor's edge colo (IATA) + country.
 *     Same-origin, no third party, nothing stored.
 *  2. PerformanceNavigationTiming - measured TTFB and transfer size
 *     of the page being viewed.
 *
 * Never throws; resolves with whatever is actually known, or null.
 * On localhost/non-Cloudflare hosts the trace just fails inside its
 * timeout and only the performance part remains.
 */

import { isLocalHostName, parseTrace, readNavigationTelemetry, type Telemetry } from "./telemetry-core";

export type { Telemetry } from "./telemetry-core";

const TRACE_TIMEOUT_MS = 1500;

function isLocalHost(): boolean {
  return isLocalHostName(location.hostname);
}

async function fetchTrace(): Promise<Partial<Telemetry>> {
  /* /cdn-cgi/trace only exists behind Cloudflare - skip the request
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
