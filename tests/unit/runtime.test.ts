import { describe, expect, it, vi } from "vitest";
import { createActivityGate } from "@/lib/runtime/activity-gate";
import { pauseAll, registerPausable, resumeAll } from "@/lib/runtime/pause-registry";

class FakeDocument {
  visibilityState = "visible";
  private listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

class FakeObserver {
  static last: FakeObserver | null = null;
  callback: IntersectionObserverCallback;
  disconnected = false;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeObserver.last = this;
  }

  observe(): void {}
  disconnect(): void {
    this.disconnected = true;
  }

  setVisible(visible: boolean): void {
    this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as never);
  }
}

describe("pause registry", () => {
  it("pauses and refreshes before resume", () => {
    const calls: string[] = [];
    const dispose = registerPausable({
      pause: () => calls.push("pause"),
      refreshTheme: () => calls.push("refresh"),
      resume: () => calls.push("resume"),
    });
    pauseAll();
    resumeAll();
    dispose();
    expect(calls).toEqual(["pause", "refresh", "resume"]);
  });

  it("disposes idempotently", () => {
    const pause = vi.fn();
    const dispose = registerPausable({ pause, resume: vi.fn() });
    dispose();
    dispose();
    pauseAll();
    expect(pause).not.toHaveBeenCalled();
  });
});

describe("activity gate", () => {
  it("combines visibility, intersection, manual pause, and destroy", () => {
    const doc = new FakeDocument();
    const changes: boolean[] = [];
    const gate = createActivityGate({
      target: {} as Element,
      documentRef: doc as unknown as Document,
      observerFactory: FakeObserver as unknown as typeof IntersectionObserver,
      onActiveChange: (active) => changes.push(active),
    });

    FakeObserver.last?.setVisible(false);
    gate.pause();
    FakeObserver.last?.setVisible(true);
    gate.resume();
    doc.visibilityState = "hidden";
    doc.emit("visibilitychange");
    gate.destroy();
    gate.destroy();
    gate.pause();
    doc.visibilityState = "visible";
    doc.emit("visibilitychange");

    expect(changes).toEqual([true, false, true, false]);
    expect(FakeObserver.last?.disconnected).toBe(true);
  });

  it("does not publish duplicate active states", () => {
    const doc = new FakeDocument();
    const changes: boolean[] = [];
    const gate = createActivityGate({
      target: {} as Element,
      documentRef: doc as unknown as Document,
      observerFactory: FakeObserver as unknown as typeof IntersectionObserver,
      onActiveChange: (active) => changes.push(active),
    });
    FakeObserver.last?.setVisible(true);
    FakeObserver.last?.callback([], FakeObserver.last as never);
    gate.resume();
    gate.destroy();
    expect(changes).toEqual([true]);
  });
});
