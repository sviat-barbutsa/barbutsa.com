import { expect, test } from "@playwright/test";
import { launchFlamenco } from "./actions";

test("Flamenco imports lazily, traps focus, pauses, resumes, and tears down", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".flamenco-overlay")).toHaveCount(0);
  const { dialog, opener } = await launchFlamenco(page);
  const canvas = dialog.locator("canvas");
  await expect(canvas).toBeFocused();

  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  const pause = dialog.locator("[data-fl-pause]");
  const continueButton = dialog.getByRole("button", { name: "CONTINUE" });
  await expect(pause).toBeVisible();
  await expect(continueButton).toBeFocused();

  const firstButton = dialog.locator(".fl-meta [data-fl-quit]");
  const lastButton = dialog.locator("[data-fl-sound]");
  await lastButton.focus();
  await page.keyboard.press("Tab");
  await expect(firstButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastButton).toBeFocused();

  await continueButton.click();
  await expect(pause).toBeHidden();
  await expect(canvas).toBeFocused();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.locator(".flamenco-overlay")).toHaveCount(0);
  await expect(opener).toBeFocused();
});
