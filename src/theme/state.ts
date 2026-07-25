export type ResolvedTheme = "light" | "dark";

export const STORAGE_KEY = "atlas-theme";

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: "#141412",
  light: "#ece9e2",
};

export function isResolvedTheme(value: string | null): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

function getLocalStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function readStoredTheme(storage?: Storage): ResolvedTheme | null {
  try {
    const stored = getLocalStorage(storage)?.getItem(STORAGE_KEY) ?? null;
    return isResolvedTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: ResolvedTheme, storage?: Storage): void {
  try {
    getLocalStorage(storage)?.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage is optional */
  }
}

export function resolveCurrentTheme(root: HTMLElement): ResolvedTheme {
  const set = root.dataset.theme;
  if (set === "light" || set === "dark") return set;
  /* No explicit choice → dark. The OS preference is deliberately ignored:
     dark is the brand default; only a user's own toggle overrides it. */
  return "dark";
}

export function getNextTheme(theme: ResolvedTheme): ResolvedTheme {
  return theme === "dark" ? "light" : "dark";
}

export function commitTheme(
  root: HTMLElement,
  theme: ResolvedTheme,
  options: {
    persist?: boolean;
    meta?: HTMLMetaElement | null;
    storage?: Storage;
  } = {},
): void {
  root.dataset.theme = theme;
  if (options.meta) options.meta.content = THEME_COLORS[theme];
  if (options.persist ?? true) writeStoredTheme(theme, options.storage);
}
