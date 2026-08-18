import { expect, test } from "@playwright/test";

test("the final region supplies the single gap before the footer", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });

  for (const route of ["/", "/articles", "/contact", "/work/collaborative-saas-frontend-platform"]) {
    await page.goto(route);

    const spacing = await page.evaluate(() => {
      const footer = document.querySelector<HTMLElement>(".site-foot");
      const regions = Array.from(document.querySelectorAll<HTMLElement>("main .region"));
      const finalRegion = regions.at(-1);
      const finalContent = finalRegion?.lastElementChild;

      if (!footer || !finalRegion || !finalContent) return null;

      return {
        footerMarginTop: Number.parseFloat(getComputedStyle(footer).marginTop),
        regionPaddingBottom: Number.parseFloat(getComputedStyle(finalRegion).paddingBottom),
        visibleGap: footer.getBoundingClientRect().top - finalContent.getBoundingClientRect().bottom,
      };
    });

    expect(spacing, `${route} should expose a final region and footer`).not.toBeNull();
    expect(spacing!.footerMarginTop).toBe(0);
    expect(spacing!.regionPaddingBottom).toBeGreaterThan(50);
    expect(Math.abs(spacing!.visibleGap - spacing!.regionPaddingBottom)).toBeLessThan(2);
  }
});

test("adjacent Home regions share one mobile section gap", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");

  const spacing = await page.evaluate(() => {
    const selectedWork = document.querySelector<HTMLElement>('[data-home-section="selected-work"]');
    const tools = document.querySelector<HTMLElement>('[data-home-section="tools"]');
    const previousContent = selectedWork?.lastElementChild;
    const nextContent = tools?.firstElementChild;

    if (!selectedWork || !tools || !previousContent || !nextContent) return null;

    return {
      previousPaddingBottom: Number.parseFloat(getComputedStyle(selectedWork).paddingBottom),
      nextPaddingTop: Number.parseFloat(getComputedStyle(tools).paddingTop),
      visibleGap: nextContent.getBoundingClientRect().top - previousContent.getBoundingClientRect().bottom,
    };
  });

  expect(spacing).not.toBeNull();
  expect(spacing!.nextPaddingTop).toBe(0);
  expect(spacing!.previousPaddingBottom).toBeGreaterThan(50);
  expect(Math.abs(spacing!.visibleGap - spacing!.previousPaddingBottom)).toBeLessThan(2);
});
