import { expect, test } from "@playwright/test";
import { launchFlamenco } from "./actions";

test("Flamenco imports lazily, traps focus, pauses, resumes, and tears down", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".flamenco-overlay")).toHaveCount(0);
  const { dialog, opener } = await launchFlamenco(page);
  const canvas = dialog.locator("canvas");
  await expect(canvas).toBeFocused();

  const canvasIsBounded = async () =>
    canvas.evaluate((node) => {
      const target = node as HTMLCanvasElement;
      const canvasBox = target.getBoundingClientRect();
      const stageBox = target.parentElement?.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      return Boolean(
        stageBox &&
        Math.abs(canvasBox.width - stageBox.width) <= 1 &&
        Math.abs(canvasBox.height - stageBox.height) <= 1 &&
        Math.abs(target.width - Math.round(canvasBox.width * dpr)) <= 1 &&
        Math.abs(target.height - Math.round(canvasBox.height * dpr)) <= 1,
      );
    });
  await expect.poll(canvasIsBounded).toBe(true);

  if (isMobile) {
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    for (const width of [320, 390, viewport?.width ?? 412]) {
      await page.setViewportSize({ width, height: viewport?.height ?? 915 });
      await expect.poll(canvasIsBounded).toBe(true);
    }
  }

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
