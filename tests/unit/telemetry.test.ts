import { describe, expect, it } from "vitest";
import { isLocalHostName, parseTrace, readNavigationTelemetry } from "@/lib/telemetry-core";

describe("telemetry parsing", () => {
  it("validates trace colo and loc fields", () => {
    expect(parseTrace("colo=lhr\nloc=gb")).toEqual({ colo: "LHR", loc: "GB" });
    expect(parseTrace("colo=bad1\nloc=usa")).toEqual({});
  });

  it("detects local hostnames", () => {
    expect(isLocalHostName("localhost")).toBe(true);
    expect(isLocalHostName("site.local")).toBe(true);
    expect(isLocalHostName("sviatoslav.dev")).toBe(false);
  });

  it("rounds positive navigation metrics and omits unavailable values", () => {
    const nav = {
      responseStart: 125.7,
      requestStart: 100.1,
      transferSize: 1536,
    } as PerformanceNavigationTiming;
    expect(readNavigationTelemetry(nav)).toEqual({ ttfbMs: 26, pageKb: 1.5 });
    expect(
      readNavigationTelemetry({
        responseStart: 0,
        requestStart: 5,
        transferSize: 0,
      } as PerformanceNavigationTiming),
    ).toEqual({});
  });
});
