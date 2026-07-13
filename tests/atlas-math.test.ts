import { describe, expect, it } from "vitest";
import { arcPoint, easeInOut, routePosition } from "../src/lib/atlas/math";

describe("easeInOut", () => {
  it("clamps and eases", () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(2)).toBe(1);
  });
});

describe("arcPoint", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  it("hits endpoints exactly", () => {
    expect(arcPoint(a, b, 0)).toEqual(a);
    expect(arcPoint(a, b, 1)).toEqual(b);
  });
  it("bows away from the straight line mid-arc", () => {
    const mid = arcPoint(a, b, 0.5);
    expect(mid.x).toBeCloseTo(50);
    expect(Math.abs(mid.y)).toBeGreaterThan(0);
  });
});

describe("routePosition", () => {
  it("walks arcs in order", () => {
    expect(routePosition(0, 2, 1)?.arc).toBe(0);
    expect(routePosition(1.5, 2, 1)?.arc).toBe(1);
  });
  it("returns null when finished or invalid", () => {
    expect(routePosition(2, 2, 1)).toBeNull();
    expect(routePosition(-0.1, 2, 1)).toBeNull();
    expect(routePosition(0.5, 0, 1)).toBeNull();
  });
});

import { pickDifferent } from "../src/lib/atlas/svg-atlas";

describe("pickDifferent", () => {
  const codes = ["A", "B", "C"];
  it("never repeats the previous code", () => {
    for (let i = 0; i < 50; i++) {
      expect(pickDifferent("B", codes)).not.toBe("B");
    }
  });
  it("handles degenerate lists", () => {
    expect(pickDifferent("A", ["A"])).toBe("A");
    expect(pickDifferent("A", [])).toBe("A");
  });
});

import { hits } from "../src/lib/flamenco/game";

describe("flamenco collision", () => {
  it("detects overlap and clear misses", () => {
    expect(hits(70, 90, 14, 75, 88, 20, 16)).toBe(true);   // overlapping
    expect(hits(70, 90, 14, 200, 88, 20, 16)).toBe(false); // far right
    expect(hits(70, 40, 14, 75, 88, 20, 16)).toBe(false);  // jumped over
  });
});
