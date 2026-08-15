import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PALETTE } from "@/theme/palette";
import { THEME_COLORS } from "@/theme/state";

const tokens = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

function cssToken(name: string): string {
  const match = tokens.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token ${name} not found in tokens.css`);
  return match[1].trim();
}

describe("palette mirror", () => {
  it("matches the raw ramp in tokens.css", () => {
    expect(PALETTE.ink).toBe(cssToken("--ink"));
    expect(PALETTE.paper).toBe(cssToken("--paper"));
    expect(PALETTE.chartreuse).toBe(cssToken("--chartreuse"));
    expect(PALETTE.dim).toBe(cssToken("--d-dim"));
    expect(PALETTE.faint).toBe(cssToken("--d-faint"));
    expect(PALETTE.lDim).toBe(cssToken("--l-dim"));
  });

  it("feeds the theme-color meta pair", () => {
    expect(THEME_COLORS.dark).toBe(PALETTE.ink);
    expect(THEME_COLORS.light).toBe(PALETTE.paper);
  });
});
