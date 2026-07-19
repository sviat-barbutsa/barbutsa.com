import { describe, expect, it, vi } from "vitest";
import { hits, PacketRunner } from "@/lib/flamenco/game";
import { readBestScore, writeBestScore } from "@/lib/flamenco/score-storage";

const frame = {
  dt: 0.05,
  elapsed: 0,
  width: 160,
  height: 200,
  tokens: {},
  reducedMotion: false,
};

describe("flamenco game", () => {
  it("detects overlap, misses, and touching-edge non-overlap", () => {
    expect(hits(70, 90, 14, 75, 88, 20, 16)).toBe(true);
    expect(hits(70, 90, 14, 200, 88, 20, 16)).toBe(false);
    expect(hits(70, 90, 14, 84, 90, 20, 16)).toBe(false);
  });

  it("transitions from ready to running and can reset after death", () => {
    const onPhase = vi.fn();
    const runner = new PacketRunner({ onPhase }, { random: () => 0, scoreStorage: null });
    runner.jump();
    expect(runner.phase).toBe("running");
    expect(onPhase).toHaveBeenCalledWith("running");

    for (let step = 0; step < 100 && runner.phase === "running"; step += 1) runner.update(frame);
    expect(runner.phase).toBe("dead");

    runner.jump();
    expect(runner.phase).toBe("running");
    expect(runner.msSaved).toBe(0);
  });

  it("keeps gameplay working when score storage throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;

    expect(readBestScore(storage)).toBe(0);
    expect(() => writeBestScore(10, storage)).not.toThrow();
    expect(() => new PacketRunner({}, { scoreStorage: storage })).not.toThrow();
  });

  it("survives a blocked sessionStorage getter", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });

    try {
      expect(readBestScore()).toBe(0);
      expect(() => writeBestScore(10)).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
      else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
  });
});
