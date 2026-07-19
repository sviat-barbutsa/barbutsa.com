import { describe, expect, it, vi } from "vitest";
import { renderStaticAtlasRoute } from "@/lib/atlas/controller";
import {
  chooseNextRoute,
  createRouteState,
  normalizeTelemetry,
  pickDifferent,
  setRouteTelemetry,
  staticRoute,
} from "@/lib/atlas/model";
import type { AtlasView } from "@/lib/atlas/view";

describe("atlas model", () => {
  it("handles empty and single candidate lists", () => {
    expect(pickDifferent("A", [])).toBe("A");
    expect(pickDifferent("A", ["A"])).toBe("A");
  });

  it("selects from candidates excluding the last code", () => {
    expect(pickDifferent("B", ["A", "B", "C"], () => 0)).toBe("A");
    expect(pickDifferent("B", ["A", "B", "C"], () => 0.99)).toBe("C");
  });

  it("routes first valid visitor colo immediately", () => {
    const state = createRouteState();
    setRouteTelemetry(state, { colo: "lhr", ttfbMs: 42 });
    const route = chooseNextRoute(state, () => 0);
    expect(route.code).toBe("LHR");
    expect(route.ttfb).toBe(42);
    expect(route.hit).toBe(true);
  });

  it("weights recurring visitor colo without immediate repeats", () => {
    const state = createRouteState();
    setRouteTelemetry(state, { colo: "FRA" });
    expect(chooseNextRoute(state, () => 0).code).toBe("FRA");
    expect(chooseNextRoute(state, () => 0).code).not.toBe("FRA");
    expect(chooseNextRoute(state, () => 0).code).toBe("FRA");
  });

  it("rejects malformed trace fields and keeps valid partial data", () => {
    expect(normalizeTelemetry({ colo: "lhr<script>", loc: "USA" })).toBeNull();
    expect(normalizeTelemetry({ colo: "iad", loc: "us", pageKb: 12.34 })).toEqual({
      colo: "IAD",
      loc: "US",
      mappedColo: "IAD",
      pageKb: 12.3,
    });
  });

  it("falls back when visitor colo is unknown", () => {
    const state = createRouteState();
    setRouteTelemetry(state, { colo: "XYZ", ttfbMs: 30 });
    expect(chooseNextRoute(state, () => 0).code).not.toBe("XYZ");
  });

  it("creates a static measured route", () => {
    const route = staticRoute("WAW", normalizeTelemetry({ colo: "WAW", ttfbMs: 20 }));
    expect(route.code).toBe("WAW");
    expect(route.showMeasuredLine).toBe(true);
    expect(route.telemetry?.ttfbMs).toBe(20);
  });

  it("renders a complete reduced-motion route without a pulse", () => {
    const route = staticRoute("LHR");
    const view = {
      bindTooltips: vi.fn(),
      markHot: vi.fn(),
      setRoute: vi.fn(() => 287.5),
      setRouteProgress: vi.fn(),
      setPulseOpacity: vi.fn(),
      setRouteVisible: vi.fn(),
      renderRoute: vi.fn(),
    } as unknown as AtlasView;

    renderStaticAtlasRoute(view, route, null);

    expect(view.setRoute).toHaveBeenCalledWith("LHR");
    expect(view.setRouteProgress).toHaveBeenCalledWith(287.5, 1);
    expect(view.setPulseOpacity).toHaveBeenCalledWith(0);
    expect(view.markHot).toHaveBeenCalledWith("LHR");
    expect(view.renderRoute).toHaveBeenCalledWith(route, null);
  });
});
