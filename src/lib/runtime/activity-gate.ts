export interface ActivityGateHandle {
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface ActivityGateOptions {
  target: Element;
  onActiveChange: (active: boolean) => void;
  rootMargin?: string;
  documentRef?: Document;
  observerFactory?: typeof IntersectionObserver;
}

export function createActivityGate({
  target,
  onActiveChange,
  rootMargin = "64px",
  documentRef = document,
  observerFactory = IntersectionObserver,
}: ActivityGateOptions): ActivityGateHandle {
  let targetVisible = true;
  let pageVisible = documentRef.visibilityState === "visible";
  let manuallyPaused = false;
  let destroyed = false;
  let active: boolean | undefined;

  const publish = (): void => {
    if (destroyed) return;
    const next = targetVisible && pageVisible && !manuallyPaused;
    if (next === active) return;
    active = next;
    onActiveChange(next);
  };

  const onVisibility = (): void => {
    pageVisible = documentRef.visibilityState === "visible";
    publish();
  };

  const observer = new observerFactory(
    (entries) => {
      targetVisible = entries[entries.length - 1]?.isIntersecting ?? true;
      publish();
    },
    { rootMargin },
  );

  observer.observe(target);
  documentRef.addEventListener("visibilitychange", onVisibility);
  publish();

  return {
    pause: () => {
      manuallyPaused = true;
      publish();
    },
    resume: () => {
      manuallyPaused = false;
      publish();
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      documentRef.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
