import { expect, test } from "@playwright/test";

const route = "/work/piggy-original-loyalty-frontend";

test("Piggy.eu is a historical frontend card with confident present-day attribution", async ({ page }) => {
  await page.goto("/");

  const card = page.locator('[data-flagship-card="piggy-original-loyalty-frontend"]');
  await expect(card).toHaveAttribute("data-tier", "supporting");
  await expect(card).toContainText("ARCHIVE · LOYALTY PLATFORM · 2018–19");
  await expect(card).toContainText("PIGGY.EU TODAY");
  await expect(card.locator(".flagship-tech")).toHaveText("React · TypeScript · MobX");
  await expect(card.locator('figure[data-media="product"]')).toHaveAttribute("aria-label", "Piggy.eu today");
  await expect(card.locator("img")).toHaveAttribute("alt", "Piggy.eu homepage today");
  await expect(card.locator("img")).toHaveAttribute("src", "/work/piggy/piggy-current-homepage.webp");
  await expect(card.getByRole("link", { name: "View project →" })).toHaveAttribute("href", route);

  const currentProduct = card.getByRole("link", { name: "Visit Piggy.eu today ↗" });
  await expect(currentProduct).toHaveAttribute("href", "https://www.piggy.eu/");
  await expect(currentProduct).toHaveAttribute("target", "_blank");
  await expect(currentProduct).toHaveAttribute("rel", "noopener noreferrer");
});

test("Piggy.eu case study publishes verified scope with concise attribution", async ({ page }) => {
  await page.goto(route);

  await expect(page).toHaveTitle("Piggy.eu Original Loyalty Frontend | Sviatoslav Barbutsa");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://barbutsa.com/work/piggy-original-loyalty-frontend",
  );
  const graph = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((node) => JSON.parse(node.textContent ?? "{}"));
  const work = graph["@graph"].find((node: { "@type"?: string }) => node["@type"] === "CreativeWork");
  expect(work).toMatchObject({
    name: "Piggy.eu Original Loyalty Frontend",
    url: "https://barbutsa.com/work/piggy-original-loyalty-frontend",
    creator: { "@id": "https://barbutsa.com/#person" },
  });
  expect(graph["@graph"].some((node: { "@type"?: string }) => node["@type"] === "SoftwareApplication")).toBe(false);

  await expect(page.getByText("SharpMinds", { exact: true })).toBeVisible();
  await expect(page.getByText("Piggy.eu", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/sole frontend engineer when the project began/)).toBeVisible();
  await expect(page.locator(".case-study-copy").nth(1)).toContainText(
    "I used Webpack for module bundling and production optimization, with Jenkins for CI",
  );
  await expect(page.getByText(/more frontend engineers joined after the MVP/)).toBeVisible();
  await expect(page.locator(".case-study-highlight-grid > article")).toHaveCount(3);

  const hero = page.locator(".case-study-hero-media");
  await expect(hero.locator("img")).toHaveAttribute("src", "/work/piggy/piggy-current-homepage.webp");
  await expect(hero.locator("figcaption")).toHaveText("Piggy.eu today.");
  await expect(page.locator(".case-study-live-url")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What I worked on" })).toBeVisible();
  await expect(page.locator("#case-study-evidence")).toHaveCount(0);
  await expect(page.locator(".case-study-boundary .idx")).toHaveText("02");

  const mainText = await page.locator("main").innerText();
  expect(mainText).toMatch(/Web frontend architecture, hands-on implementation, and the reusable component library/i);
  expect(mainText).not.toMatch(/do not claim|not the original interface|context only|shown only/i);
  expect(mainText).not.toMatch(/instead of|designed to grow|engagement progressed|extend safely/i);
  expect(mainText).not.toMatch(/10,?000|current (revenue|adoption|scale)|built the entire platform/i);
});

test("Piggy.eu case study remains readable and overflow-free on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".case-study-hero-media img")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("link", { name: "View current Piggy.eu website ↗" }).focus();
  await expect(page.getByRole("link", { name: "View current Piggy.eu website ↗" })).toBeFocused();
});
