import { expect, test, type Locator, type Page } from "@playwright/test";

const identity = "Senior Frontend Engineer · React & TypeScript · Frontend Architecture · Applied AI";

async function expectWithinViewport(page: Page, locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box, "identity should have a rendered bounding box").not.toBeNull();
  expect(viewport, "the Playwright project should define a viewport").not.toBeNull();

  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
}

test("Home publishes the shared recruiter identity without horizontal overflow", async ({ page }) => {
  await page.goto("/");

  const heroIdentity = page.locator('[data-home-section="hero"] .kick');
  const footerIdentity = page.locator(".site-foot-brand + .label");

  await expect(heroIdentity).toContainText(identity.toUpperCase());
  await expect(footerIdentity).toHaveText(identity);
  await expect(page).toHaveTitle(`Sviatoslav Barbutsa - ${identity}`);

  const structuredJobTitle = await page.locator('script[type="application/ld+json"]').evaluate((node) => {
    const graph = JSON.parse(node.textContent ?? "")["@graph"] as Array<Record<string, unknown>>;
    return graph.find((entry) => entry["@type"] === "Person")?.jobTitle;
  });
  expect(structuredJobTitle).toBe(identity);

  await expectWithinViewport(page, heroIdentity);
  await expectWithinViewport(page, footerIdentity);
});

test("About consumes the shared recruiter identity without horizontal overflow", async ({ page }) => {
  await page.goto("/about");

  const roleRow = page.locator(".conf-row").filter({ has: page.locator("dt", { hasText: /^role$/ }) });
  const aboutIdentity = roleRow.locator("dd");
  const footerIdentity = page.locator(".site-foot-brand + .label");

  await expect(aboutIdentity).toHaveText(identity);
  await expect(footerIdentity).toHaveText(identity);

  await expectWithinViewport(page, aboutIdentity);
  await expectWithinViewport(page, footerIdentity);
});
