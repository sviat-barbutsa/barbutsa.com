import { pauseAll, resumeAll } from "../lib/runtime/pause-registry";
import { animateFluid } from "./animations/fluid";
import { animateRadial } from "./animations/radial";
import {
  commitTheme,
  getNextTheme,
  isResolvedTheme,
  readStoredTheme,
  resolveCurrentTheme,
  STORAGE_KEY,
  type ResolvedTheme,
} from "./state";
import { collectStrategyFacts, downgrade, selectStrategy } from "./strategy";

let cleanupCurrent: (() => void) | null = null;
let transitionRunning = false;

interface ThemeTransitionHandle {
  ready: PromiseLike<unknown>;
  finished: PromiseLike<unknown>;
}

export interface AnimatedThemeSwitchOperation {
  prepare(): void;
  commit(): void;
  startTransition(commit: () => void): ThemeTransitionHandle;
  animate(): { finished: PromiseLike<unknown> };
  downgrade(reason: "animation-rejected" | "transition-error"): void;
  reportError(error: unknown): void;
  cleanup(): void;
}

export async function runAnimatedThemeSwitch(operation: AnimatedThemeSwitchOperation): Promise<void> {
  let committed = false;
  const commitOnce = (): void => {
    if (committed) return;
    committed = true;
    operation.commit();
  };

  try {
    operation.prepare();
    const transition = operation.startTransition(commitOnce);
    await transition.ready;
    const results = await Promise.allSettled([operation.animate().finished, transition.finished]);
    if (results.some((result) => result.status === "rejected")) {
      operation.downgrade("animation-rejected");
    }
  } catch (error) {
    operation.downgrade("transition-error");
    operation.reportError(error);
  } finally {
    try {
      commitOnce();
    } finally {
      operation.cleanup();
    }
  }
}

function syncControls(controls: HTMLButtonElement[], theme: ResolvedTheme): void {
  for (const control of controls) {
    control.setAttribute("aria-pressed", String(theme === "dark"));
    control.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  }
}

function setBusy(controls: HTMLButtonElement[], busy: boolean): void {
  for (const control of controls) {
    control.setAttribute("aria-disabled", String(busy));
    control.dataset.busy = String(busy);
  }
}

function announce(status: HTMLElement | null, theme: ResolvedTheme): void {
  if (status) status.textContent = `${theme} theme active`;
}

function current(systemDark: MediaQueryList): ResolvedTheme {
  return resolveCurrentTheme(document.documentElement, systemDark.matches);
}

function commitAndSync(theme: ResolvedTheme, controls: HTMLButtonElement[], persist = true): void {
  commitTheme(document.documentElement, theme, {
    persist,
    meta: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'),
  });
  syncControls(controls, theme);
}

async function requestThemeSwitch(
  event: MouseEvent | undefined,
  trigger: HTMLElement,
  controls: HTMLButtonElement[],
  status: HTMLElement | null,
  systemDark: MediaQueryList,
): Promise<void> {
  if (transitionRunning) return;
  const root = document.documentElement;
  const nextTheme = getNextTheme(current(systemDark));
  const strategy = selectStrategy(collectStrategyFacts());

  if (strategy === "instant") {
    commitAndSync(nextTheme, controls);
    announce(status, nextTheme);
    return;
  }

  transitionRunning = true;
  await runAnimatedThemeSwitch({
    prepare: () => {
      root.dataset.themeMotion = "running";
      setBusy(controls, true);
      pauseAll();
    },
    commit: () => commitAndSync(nextTheme, controls),
    startTransition: (commit) => document.startViewTransition!(commit),
    animate: () =>
      strategy === "fluid"
        ? animateFluid(root, window.innerWidth)
        : animateRadial(root, event, trigger, {
            width: window.innerWidth,
            height: window.innerHeight,
          }),
    downgrade,
    reportError: (error) => console.debug("Theme transition skipped", error),
    cleanup: () => {
      try {
        delete root.dataset.themeMotion;
        setBusy(controls, false);
      } finally {
        try {
          resumeAll();
        } finally {
          transitionRunning = false;
          announce(status, current(systemDark));
        }
      }
    },
  });
}

export function initThemeController(): () => void {
  cleanupCurrent?.();
  const controls = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]"));
  const status = document.getElementById("theme-status");
  const systemDark = matchMedia("(prefers-color-scheme: dark)");

  commitAndSync(current(systemDark), controls, false);

  const removers = controls.map((control) => {
    const onClick = (event: MouseEvent): void => {
      void requestThemeSwitch(event, control, controls, status, systemDark);
    };
    control.addEventListener("click", onClick);
    return () => control.removeEventListener("click", onClick);
  });

  const onSystem = (event: MediaQueryListEvent): void => {
    if (readStoredTheme()) return;
    commitAndSync(event.matches ? "dark" : "light", controls, false);
  };
  systemDark.addEventListener("change", onSystem);

  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY && isResolvedTheme(event.newValue)) {
      commitAndSync(event.newValue, controls, false);
    }
  };
  addEventListener("storage", onStorage);

  const cleanup = (): void => {
    removers.forEach((remove) => remove());
    systemDark.removeEventListener("change", onSystem);
    removeEventListener("storage", onStorage);
    if (cleanupCurrent === cleanup) cleanupCurrent = null;
  };
  cleanupCurrent = cleanup;
  return cleanup;
}
