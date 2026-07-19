import { describe, expect, it, vi } from "vitest";
import {
  animateFluid,
  clamp,
  getLiquidKeyframes,
  liquidPolygon,
  PROFILES,
  selectProfile,
  smoothstep,
} from "@/theme/animations/fluid";
import { animateRadial, coveringRadius, radialOrigin } from "@/theme/animations/radial";

describe("theme motion math", () => {
  it("clamps and smoothsteps boundaries", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
  });

  it("creates bounded deterministic polygons", () => {
    const polygon = liquidPolygon(0.5, PROFILES.mobile);
    expect(polygon).toMatch(/^polygon\(/);
    expect(polygon).toContain("100% 0%");
  });

  it("selects mobile and desktop profiles", () => {
    expect(selectProfile(360).id).toBe("mobile");
    expect(selectProfile(1440).id).toBe("desktop");
  });

  it("creates fluid animations", () => {
    const animation = { finished: Promise.resolve() } as unknown as Animation;
    const root = { animate: vi.fn(() => animation) } as unknown as HTMLElement;
    expect(animateFluid(root, 360)).toBe(animation);
    expect(root.animate).toHaveBeenCalled();
    const frames = getLiquidKeyframes(PROFILES.mobile);
    expect(getLiquidKeyframes(PROFILES.mobile)).toBe(frames);
  });

  it("calculates pointer and keyboard radial origins", () => {
    const trigger = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 40,
        height: 20,
      }),
    } as HTMLElement;
    expect(radialOrigin(undefined, trigger)).toEqual({ x: 30, y: 30 });
    expect(radialOrigin({ detail: 1, clientX: 80, clientY: 90 } as MouseEvent, trigger)).toEqual({
      x: 80,
      y: 90,
    });
  });

  it("covers viewport corners", () => {
    expect(coveringRadius({ x: 0, y: 0 }, 300, 400)).toBeGreaterThan(500);
  });

  it("creates radial animations", () => {
    const animation = { finished: Promise.resolve() } as unknown as Animation;
    const root = { animate: vi.fn(() => animation) } as unknown as HTMLElement;
    const trigger = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 40,
        height: 20,
      }),
    } as HTMLElement;
    expect(animateRadial(root, undefined, trigger, { width: 300, height: 400 })).toBe(animation);
    expect(root.animate).toHaveBeenCalled();
  });
});
