import { expect, test } from "@playwright/test";

test("English Voice Coach opens a real evidence page with verified demos", async ({ page }) => {
  await page.goto("/");

  const card = page.locator('[data-flagship-card="english-voice-coach"]');
  await card.locator('[data-card-action="media"]').click();

  await expect(page).toHaveURL(/\/work\/english-voice-coach$/);
  await expect(page.getByRole("heading", { level: 1, name: "English Voice Coach" })).toBeVisible();
  await expect(page.getByText("GOOGLE PLAY CLOSED TEST · IN REVIEW", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Earlier prototype captures used the working name English Practice", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("It is not pronunciation, accent, or fluency accuracy", { exact: false })).toBeVisible();
  await expect(page.getByText("Samsung SM-S938U1", { exact: false }).first()).toBeVisible();

  const demos = page.getByRole("link", { name: "Watch the four demo videos ↗" });
  await expect(demos).toHaveAttribute("href", "https://www.youtube.com/playlist?list=PLSFpAE7CkhDg");
  await expect(demos).toHaveAttribute("target", "_blank");
  await expect(demos).toHaveAttribute("rel", "noopener noreferrer");

  const evidence = page.locator(".case-study-hero-media img, .case-study-gallery img");
  await expect(evidence).toHaveCount(5);
  await expect(evidence.nth(3)).toHaveAttribute("alt", /word-level phrase match/);
  await expect(page.locator("main").getByRole("link", { name: /install|open app|play store/i })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
