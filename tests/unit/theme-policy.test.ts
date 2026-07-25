import { describe, expect, it, vi } from "vitest";
import { commitTheme, getNextTheme, readStoredTheme, resolveCurrentTheme, writeStoredTheme } from "@/theme/state";
import { collectStrategyFacts, downgrade, hasLowPowerHint, isDowngraded, selectStrategy } from "@/theme/strategy";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function replaceWithThrowingGlobal(name: "localStorage" | "sessionStorage"): () => void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    get: () => {
      throw new Error(`${name} unavailable`);
    },
  });
  return () => {
    if (original) Object.defineProperty(globalThis, name, original);
    else Reflect.deleteProperty(globalThis, name);
  };
}

describe("theme state and strategy", () => {
  it("resolves current and next themes, defaulting to dark", () => {
    const root = { dataset: {} } as HTMLElement;
    expect(resolveCurrentTheme(root)).toBe("dark");
    root.dataset.theme = "light";
    expect(resolveCurrentTheme(root)).toBe("light");
    root.dataset.theme = "dark";
    expect(resolveCurrentTheme(root)).toBe("dark");
    expect(getNextTheme("light")).toBe("dark");
  });

  it("reads, writes, and commits stored theme state", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const root = { dataset: {} } as HTMLElement;
    const meta = { content: "" } as HTMLMetaElement;
    expect(readStoredTheme(storage)).toBeNull();
    writeStoredTheme("dark", storage);
    expect(readStoredTheme(storage)).toBe("dark");
    commitTheme(root, "light", { meta, storage });
    expect(root.dataset.theme).toBe("light");
    expect(meta.content).toBe("#ece9e2");
    expect(readStoredTheme(storage)).toBe("light");
  });

  it("selects strategies from facts", () => {
    const base = {
      reducedMotion: false,
      forcedColors: false,
      viewTransition: true,
      downgraded: false,
      lowPower: false,
    };
    expect(selectStrategy(base)).toBe("fluid");
    expect(selectStrategy({ ...base, lowPower: true })).toBe("radial");
    expect(selectStrategy({ ...base, reducedMotion: true })).toBe("instant");
    expect(selectStrategy({ ...base, viewTransition: false })).toBe("instant");
  });

  it("handles downgrade and low-power facts", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    expect(isDowngraded(storage)).toBe(false);
    downgrade("test", storage);
    expect(isDowngraded(storage)).toBe(true);
    expect(hasLowPowerHint({ deviceMemory: 4, hardwareConcurrency: 8 } as Navigator)).toBe(true);
    expect(hasLowPowerHint({ hardwareConcurrency: 2 } as Navigator)).toBe(true);
    expect(hasLowPowerHint({ deviceMemory: 8, hardwareConcurrency: 8 } as Navigator)).toBe(false);
  });

  it("tolerates browser storage globals whose accessors throw", () => {
    const restoreLocal = replaceWithThrowingGlobal("localStorage");
    const restoreSession = replaceWithThrowingGlobal("sessionStorage");
    try {
      expect(readStoredTheme()).toBeNull();
      expect(() => writeStoredTheme("dark")).not.toThrow();
      expect(isDowngraded()).toBe(false);
      expect(() => downgrade("storage-unavailable")).not.toThrow();
    } finally {
      restoreSession();
      restoreLocal();
    }
  });

  it("collects browser strategy facts", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("forced-colors"),
    }));
    vi.stubGlobal("document", { startViewTransition: undefined });
    vi.stubGlobal("navigator", { deviceMemory: 8, hardwareConcurrency: 8 });
    vi.stubGlobal("sessionStorage", new MemoryStorage());
    expect(collectStrategyFacts()).toEqual({
      reducedMotion: false,
      forcedColors: true,
      viewTransition: false,
      downgraded: false,
      lowPower: false,
    });
    vi.unstubAllGlobals();
  });
});
