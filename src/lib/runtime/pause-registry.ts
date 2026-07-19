export interface PausableResource {
  pause(): void;
  resume(): void;
  refreshTheme?(): void;
}

const resources = new Set<PausableResource>();

export function registerPausable(resource: PausableResource): () => void {
  resources.add(resource);
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    resources.delete(resource);
  };
}

export function pauseAll(): void {
  for (const resource of resources) resource.pause();
}

export function resumeAll(): void {
  for (const resource of resources) {
    resource.refreshTheme?.();
    resource.resume();
  }
}
