import type { ShellAction } from "./types";

/**
 * Pure command resolution for the shell: what typed input maps to.
 *
 * Own-property lookup only - a plain object also answers to inherited names
 * such as `constructor` or `__proto__`, and those are not commands. Keeping
 * this out of the controller lets the rule be unit tested without a DOM.
 */
export type ResolvedCommand =
  { kind: "empty" } | { kind: "not-found"; cmd: string } | { kind: "action"; cmd: string; action: ShellAction };

export function normalizeCommand(raw: string): string {
  return raw.trim().toLowerCase();
}

export function resolveCommand(commands: Record<string, ShellAction>, raw: string): ResolvedCommand {
  const cmd = normalizeCommand(raw);
  if (!cmd) return { kind: "empty" };
  if (!Object.hasOwn(commands, cmd)) return { kind: "not-found", cmd };
  return { kind: "action", cmd, action: commands[cmd]! };
}
