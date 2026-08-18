import { expect, test } from "@playwright/test";

test("status bar shows concise section context and preserves its fixed controls", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 844 });
  await page.goto("/");

  const bar = page.locator(".status-bar");
  const section = bar.locator("[data-sb-section]");
  const scroll = bar.locator("[data-sb-scroll]");
  const heroLabel = page.locator('[data-home-section="hero"] .kick');

  await expect(bar).toBeVisible();
  await expect(section).toHaveText("§ home · intro", { ignoreCase: true });
  await expect(scroll).toHaveText("0%");
  await expect(heroLabel).toContainText("Sviatoslav Barbutsa", { ignoreCase: true });
  await expect(heroLabel).toContainText("Senior Frontend Engineer", { ignoreCase: true });

  const geometry = await bar.evaluate((element) => {
    const sectionElement = element.querySelector<HTMLElement>("[data-sb-section]");
    const scrollElement = element.querySelector<HTMLElement>("[data-sb-scroll]");
    const rightElement = element.querySelector<HTMLElement>(".sb-right");
    if (!sectionElement || !scrollElement || !rightElement) throw new Error("Status bar elements are missing");

    const sectionRect = sectionElement.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();
    const rightRect = rightElement.getBoundingClientRect();
    return {
      sectionBeforeScroll: sectionRect.right <= scrollRect.left,
      scrollBeforeRight: scrollRect.right <= rightRect.left,
      rightWithinViewport: rightRect.right <= innerWidth,
    };
  });

  expect(geometry).toEqual({
    sectionBeforeScroll: true,
    scrollBeforeRight: true,
    rightWithinViewport: true,
  });
});
