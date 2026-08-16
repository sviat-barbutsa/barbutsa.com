import { describe, expect, it } from "vitest";
import { normalizeCommand, resolveCommand } from "@/lib/shell/commands";
import type { ShellAction } from "@/lib/shell/types";

const commands: Record<string, ShellAction> = {
  help: { type: "say", text: "try: help" },
  work: { type: "go", href: "/work" },
  clear: { type: "run", fn: () => {} },
};

describe("normalizeCommand", () => {
  it("trims and lowercases", () => {
    expect(normalizeCommand("  HeLp ")).toBe("help");
  });
});

describe("resolveCommand", () => {
  it("resolves own commands by normalized name", () => {
    expect(resolveCommand(commands, " Work ")).toEqual({ kind: "action", cmd: "work", action: commands.work });
  });

  it("treats blank input as empty", () => {
    expect(resolveCommand(commands, "   ")).toEqual({ kind: "empty" });
  });

  it("reports unknown words as not found", () => {
    expect(resolveCommand(commands, "banana")).toEqual({ kind: "not-found", cmd: "banana" });
  });

  /* Regression: a plain object answers to names inherited from Object.prototype.
     `constructor` used to resolve to a function, fall into the `say` arm and throw
     inside the typewriter, freezing the doctrine line. */
  it.each(["constructor", "__proto__", "hasOwnProperty", "toString", "valueOf"])(
    "does not resolve the inherited name %s as a command",
    (name) => {
      expect(resolveCommand(commands, name)).toEqual({ kind: "not-found", cmd: name.toLowerCase() });
    },
  );

  it("still resolves an own command that shadows an inherited name", () => {
    const shadowed: Record<string, ShellAction> = { ...commands };
    shadowed["constructor"] = { type: "say", text: "own" };
    expect(resolveCommand(shadowed, "constructor")).toMatchObject({ kind: "action", cmd: "constructor" });
  });
});
