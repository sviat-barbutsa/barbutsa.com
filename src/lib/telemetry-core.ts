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

const COLO_PATTERN = /^[A-Z]{3}$/;
const LOC_PATTERN = /^[A-Z]{2}$/;

export function isLocalHostName(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".local");
}

export function parseTrace(text: string): Partial<Telemetry> {
  const out: Partial<Telemetry> = {};
  for (const line of text.split("\n")) {
    const [key, rawValue] = line.split("=");
    const value = rawValue?.trim().toUpperCase();
    if (key === "colo" && value && COLO_PATTERN.test(value)) out.colo = value;
    if (key === "loc" && value && LOC_PATTERN.test(value)) out.loc = value;
  }
  return out;
}

export function readNavigationTelemetry(nav: PerformanceNavigationTiming | undefined): Partial<Telemetry> {
  if (!nav) return {};
  const out: Partial<Telemetry> = {};
  const ttfb = nav.responseStart - nav.requestStart;
  if (ttfb > 0) out.ttfbMs = Math.round(ttfb);
  if (nav.transferSize > 0) {
    out.pageKb = Math.round((nav.transferSize / 1024) * 10) / 10;
  }
  return out;
}
