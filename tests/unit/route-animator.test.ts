import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteAnimator } from "@/lib/atlas/route-animator";
import type { AtlasView } from "@/lib/atlas/view";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Atlas route animator", () => {
  it("freezes elapsed route time while paused and cancels on destroy", () => {
    const frames: FrameRequestCallback[] = [];
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", cancel);

    const progress: number[] = [];
    const view = {
      setRoute: vi.fn(() => 100),
      setRouteProgress: vi.fn((_length: number, value: number) => progress.push(value)),
      setPulseOpacity: vi.fn(),
      markHot: vi.fn(),
      renderRoute: vi.fn(),
      setRouteVisible: vi.fn(),
      bindTooltips: vi.fn(() => () => {}),
    } as unknown as AtlasView;
    const animator = new RouteAnimator({
      view,
      nextRoute: () => ({ code: "WAW", ttfb: 20, hit: true, showMeasuredLine: false }),
      getTelemetryRoute: () => null,
    });

    animator.resume();
    frames.shift()?.(100);
    frames.shift()?.(575);
    const beforePause = progress.at(-1);
    animator.pause();
    animator.resume();
    frames.shift()?.(10_000);

    expect(progress.at(-1)).toBeCloseTo(beforePause ?? 0, 8);
    animator.destroy();
    expect(cancel).toHaveBeenCalled();
  });
});
