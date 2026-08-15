import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PALETTE } from "../../src/theme/palette";
import { launchFlamenco, openShell } from "./actions";
import { loadSitemapInventory } from "./site";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/* getComputedStyle serializes colors as rgb(); the palette mirror holds hex. */
function hexToRgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}

async function expectNoViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations
    .map((violation) => `${violation.id} (${violation.impact ?? "unknown"}): ${violation.nodes.length} node(s)`)
    .join("\n");
  expect(results.violations, `${state} has Axe violations\n${summary}`).toEqual([]);
}

async function setTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.evaluate((value) => localStorage.setItem("atlas-theme", value), theme);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

test.describe("accessibility", () => {
  test("every sitemap page passes WCAG A and AA checks", async ({ page, request }) => {
    test.setTimeout(180_000);
    const { routes } = await loadSitemapInventory(page, request);
    for (const route of routes) {
      await test.step(route, async () => {
        await page.goto(route, { waitUntil: "networkidle" });
        await expectNoViolations(page, route);
      });
    }
  });

  test("homepage themes and the switched state pass", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });

    await setTheme(page, "dark");
    await expectNoViolations(page, "homepage explicit dark");
    await setTheme(page, "light");
    await expectNoViolations(page, "homepage explicit light");
    await setTheme(page, "dark");
    await page.locator("[data-theme-toggle]").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    /* Style recalc after the data-theme flip is async under load; scan only
       once the switched palette has landed (l-dim on the doctrine line), or
       axe can catch a stale dark-ramp color. The expected value comes from
       the palette mirror, which palette-sync pins to tokens.css. */
    const doctrineLine = page.locator("[data-doctrine] [data-typer-text]");
    await expect.poll(() => doctrineLine.evaluate((el) => getComputedStyle(el).color)).toBe(hexToRgb(PALETTE.lDim));
    await expectNoViolations(page, "homepage after theme switch");
  });

  test("X-ray and command shell states pass", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("footer [data-xray-toggle]").click();
    await expect(page.locator(".xray-legend")).toBeVisible();
    await expectNoViolations(page, "X-ray visible");
    await page.locator(".xray-legend [data-xray-toggle]").click();

    await openShell(page);
    await expectNoViolations(page, "command shell open");
  });

  test("Flamenco open and paused states pass", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "networkidle" });
    const { dialog } = await launchFlamenco(page);
    await expectNoViolations(page, "Flamenco open");

    await page.keyboard.press("Space");
    await page.keyboard.press("Escape");
    await expect(dialog.locator("[data-fl-pause]")).toBeVisible();
    await expectNoViolations(page, "Flamenco paused");
    await page.keyboard.press("Escape");
  });
});
