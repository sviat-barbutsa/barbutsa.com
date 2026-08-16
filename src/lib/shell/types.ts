/** A run command answers with text, or returns nothing to resume the ambient line. */
export type ShellRunResult = string | void;

export type ShellAction =
  | { type: "say"; text: string | (() => string) }
  | { type: "go"; href: string }
  | { type: "run"; fn: () => ShellRunResult | Promise<ShellRunResult> };

export interface ShellConfig {
  commands: Record<string, ShellAction>;
  suspendAmbient: () => void;
  resumeAmbient: () => void;
  announce?: (text: string) => void;
}

export interface ShellHandle {
  destroy(): void;
}
