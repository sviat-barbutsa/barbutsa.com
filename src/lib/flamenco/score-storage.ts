const STORE_KEY = "flamenco-best";

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export function readBestScore(storage?: Storage | null): number {
  try {
    return Number((storage === undefined ? getSessionStorage() : storage)?.getItem(STORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(score: number, storage?: Storage | null): void {
  try {
    (storage === undefined ? getSessionStorage() : storage)?.setItem(STORE_KEY, String(score));
  } catch {
    /* score persistence is optional */
  }
}
