export type ShellAction =
  | { type: "say"; text: string | (() => string) }
  | { type: "go"; href: string }
  | { type: "run"; fn: () => string | void };

export interface ShellConfig {
  commands: Record<string, ShellAction>;
  suspendAmbient: () => void;
  resumeAmbient: () => void;
  announce?: (text: string) => void;
}

export interface ShellHandle {
  destroy(): void;
}
