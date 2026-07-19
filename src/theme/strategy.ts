export type ThemeStrategy = "fluid" | "radial" | "instant";

export interface StrategyFacts {
  reducedMotion: boolean;
  forcedColors: boolean;
  viewTransition: boolean;
  downgraded: boolean;
  lowPower: boolean;
}

export const SESSION_KEY = "theme-motion-radial-only";

function getSessionStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function selectStrategy(facts: StrategyFacts): ThemeStrategy {
  if (facts.reducedMotion || facts.forcedColors || !facts.viewTransition) {
    return "instant";
  }
  if (facts.downgraded || facts.lowPower) return "radial";
  return "fluid";
}

export function isDowngraded(storage?: Storage): boolean {
  try {
    return getSessionStorage(storage)?.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function downgrade(reason: string, storage?: Storage): void {
  try {
    const target = getSessionStorage(storage);
    target?.setItem(SESSION_KEY, "1");
    target?.setItem("theme-motion-downgrade-reason", reason);
  } catch {
    /* optional */
  }
}

export function hasLowPowerHint(nav: Navigator = navigator): boolean {
  const memory = (nav as { deviceMemory?: number }).deviceMemory;
  const cores = nav.hardwareConcurrency;
  return (typeof memory === "number" && memory <= 4) || (typeof cores === "number" && cores <= 4);
}

export function collectStrategyFacts(): StrategyFacts {
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    forcedColors: matchMedia("(forced-colors: active)").matches,
    viewTransition: typeof document.startViewTransition === "function",
    downgraded: isDowngraded(),
    lowPower: hasLowPowerHint(),
  };
}
