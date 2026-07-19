import { describe, expect, it, vi } from "vitest";
import { runAnimatedThemeSwitch, type AnimatedThemeSwitchOperation } from "@/theme/theme-controller";

function createOperation(overrides: Partial<AnimatedThemeSwitchOperation> = {}): AnimatedThemeSwitchOperation {
  return {
    prepare: vi.fn(),
    commit: vi.fn(),
    startTransition: vi.fn((commit: () => void) => {
      commit();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    }),
    animate: vi.fn(() => ({ finished: Promise.resolve() })),
    downgrade: vi.fn(),
    reportError: vi.fn(),
    cleanup: vi.fn(),
    ...overrides,
  };
}

describe("theme transition controller", () => {
  it("commits once and cleans up when transition startup fails", async () => {
    const operation = createOperation({
      startTransition: vi.fn(() => {
        throw new Error("transition unavailable");
      }),
    });

    await runAnimatedThemeSwitch(operation);

    expect(operation.commit).toHaveBeenCalledOnce();
    expect(operation.animate).not.toHaveBeenCalled();
    expect(operation.downgrade).toHaveBeenCalledWith("transition-error");
    expect(operation.reportError).toHaveBeenCalledOnce();
    expect(operation.cleanup).toHaveBeenCalledOnce();
  });

  it("does not recommit and still cleans up after a rejected animation", async () => {
    const operation = createOperation({
      startTransition: vi.fn((commit: () => void) => {
        commit();
        return {
          ready: Promise.resolve(),
          finished: Promise.reject(new Error("transition animation failed")),
        };
      }),
    });

    await runAnimatedThemeSwitch(operation);

    expect(operation.commit).toHaveBeenCalledOnce();
    expect(operation.downgrade).toHaveBeenCalledOnce();
    expect(operation.downgrade).toHaveBeenCalledWith("animation-rejected");
    expect(operation.reportError).not.toHaveBeenCalled();
    expect(operation.cleanup).toHaveBeenCalledOnce();
  });

  it("runs cleanup when the guarded commit itself fails", async () => {
    const operation = createOperation({
      commit: vi.fn(() => {
        throw new Error("commit failed");
      }),
    });

    await runAnimatedThemeSwitch(operation);

    expect(operation.commit).toHaveBeenCalledOnce();
    expect(operation.downgrade).toHaveBeenCalledWith("transition-error");
    expect(operation.cleanup).toHaveBeenCalledOnce();
  });
});
