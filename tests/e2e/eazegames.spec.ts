import { expect, test } from "@playwright/test";

const route = "/work/eazegames-original-web-platform";

test("EazeGames is a compact archive card with an active-product link", async ({ page }) => {
  await page.goto("/");

  const selected = page.getByRole("region", { name: "Selected Product Work", exact: true });
  const cards = selected.locator("[data-flagship-card]");
  await expect(cards).toHaveCount(7);
  await expect(cards.locator("h3")).toHaveText([
    "Collaborative SaaS Frontend Platform",
    "Piggy.eu",
    "EazeGames",
    "Zharwing Memory",
    "Llamail",
    "English Voice Coach",
    "North Peak Appliance Repair",
  ]);

  const eaze = selected.locator('[data-flagship-card="eazegames-original-web-platform"]');
  await expect(eaze).toHaveAttribute("data-tier", "supporting");
  await expect(eaze).toContainText("ARCHIVE · WEB PLATFORM · 2016–17");
  await expect(eaze).toContainText("Original real-time competition platform.");
  await expect(eaze).not.toContainText("Historical Version 1 case study");
  await expect(eaze.locator('figure[data-media="historical"]')).toBeVisible();
  await expect(eaze.locator("figcaption")).toHaveCount(0);
  await expect(eaze.locator("picture source[type='image/avif']")).toHaveAttribute("srcset", /eazegames-card.*\.avif/);
  await expect(eaze.locator("img")).toHaveAttribute(
    "alt",
    "Sanitized archival EazeGames Version 1 competition and game-discovery interface",
  );
  await expect(eaze.locator("img")).toHaveAttribute("loading", "eager");
  await expect(eaze.getByRole("link", { name: "View project →" })).toHaveAttribute("href", route);

  const currentProduct = eaze.getByRole("link", { name: "Visit EazeGames today ↗" });
  await expect(currentProduct).toHaveAttribute("href", "https://eazegames.com/");
  await expect(currentProduct).toHaveAttribute("target", "_blank");
  await expect(currentProduct).toHaveAttribute("rel", "noopener noreferrer");
  await expect(currentProduct).toHaveClass(/flagship-related-link/);
  await expect(currentProduct).not.toHaveClass(/btn/);

  await page.goto("/work");
  const published = page.getByRole("region", { name: "Published project overviews", exact: true });
  await expect(published.locator("[data-flagship-card]").nth(2)).toHaveAttribute(
    "data-flagship-card",
    "eazegames-original-web-platform",
  );
  await expect(
    published.locator('[data-flagship-card="eazegames-original-web-platform"] [data-card-action="primary"]'),
  ).toHaveAttribute("href", route);
});

test("historical case study exposes exact metadata, attribution, evidence, and architecture boundaries", async ({
  page,
}) => {
  await page.goto(route);

  await expect(page).toHaveTitle("EazeGames Original Web Platform | Sviatoslav Barbutsa");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Case study of the original EazeGames frontend: React, Redux, WebSockets, payments, role-based access, internationalization, and a shared UI library.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://barbutsa.com/work/eazegames-original-web-platform",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://barbutsa.com/work/eazegames/eazegames-og-1200x630.webp",
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");

  const graph = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((node) => JSON.parse(node.textContent ?? "{}"));
  const creativeWork = graph["@graph"].find((node: { "@type"?: string }) => node["@type"] === "CreativeWork");
  expect(creativeWork).toMatchObject({
    name: "EazeGames Original Web Platform",
    url: "https://barbutsa.com/work/eazegames-original-web-platform",
    author: { "@id": "https://barbutsa.com/#person" },
  });
  expect(graph["@graph"].some((node: { "@type"?: string }) => node["@type"] === "SoftwareApplication")).toBe(false);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("EazeGames - Original Web Platform");
  await expect(page.locator("[data-eaze-disclaimer]")).toHaveText(
    "The screenshots below show the Version 1 frontend from my 2016–2017 engagement.",
  );
  await expect(page.getByText("SharpMinds", { exact: true })).toBeVisible();
  await expect(page.getByText("Six frontend contributors after the prototype phase", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Engagement facts" })
      .getByText("Original frontend launched during the engagement", { exact: true }),
  ).toBeVisible();

  const architecture = page.getByRole("img", { name: /Frontend architecture map/ });
  await expect(architecture).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frontend architecture and delivery" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connected systems" })).toBeVisible();
  await expect(page.locator("#eaze-architecture-text")).toContainText(
    "It integrated with backend APIs, WebSocket services, game providers, and Pay.nl",
  );
  await expect(page.getByText("Not claimed as my implementation", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Pay\.nl service boundary/)).toBeVisible();

  const figures = page.locator("main .eaze-figure");
  await expect(figures).toHaveCount(7);
  await expect(figures.locator("figcaption")).toHaveCount(7);
  const archivalImages = figures.locator("img");
  for (let index = 0; index < (await archivalImages.count()); index += 1) {
    await archivalImages.nth(index).scrollIntoViewIfNeeded();
    await expect
      .poll(() => archivalImages.nth(index).evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await expect(page.locator('img[src*="7_signup"], img[src*="8_email"], img[src$=".jpg"]')).toHaveCount(0);

  const currentProduct = page.getByRole("link", { name: "Visit EazeGames today ↗" });
  await expect(currentProduct).toHaveCount(1);
  await expect(currentProduct).toHaveAttribute("target", "_blank");
  await expect(currentProduct).toHaveAttribute("rel", "noopener noreferrer");

  const mainText = await page.locator("main").innerText();
  await expect(page.locator(".eaze-reading .eaze-list li")).toHaveCount(3);
  await expect(page.locator(".eaze-retrospective .panel .eaze-list li")).toHaveCount(3);
  expect(mainText).not.toMatch(
    /not presented as my work|linked only for current product context|borrowing today’s metrics/i,
  );
  expect(mainText).not.toMatch(
    /not merely fast|product journey|product continuity|intentionally excluded|design system.*default label/i,
  );
  expect(mainText).not.toMatch(/current (revenue|prize|traffic|user)|sole developer|built the entire platform/i);
});

test("historical case study remains one-column, legible, and overflow-free on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  const figures = page.locator("main .eaze-figure");
  for (let index = 0; index < (await figures.count()) - 1; index += 1) {
    const current = await figures.nth(index).boundingBox();
    const next = await figures.nth(index + 1).boundingBox();
    expect(current).not.toBeNull();
    expect(next).not.toBeNull();
    expect(next!.y).toBeGreaterThan(current!.y);
  }

  await page.getByRole("link", { name: "Explore the original product architecture ↓" }).focus();
  await expect(page.getByRole("link", { name: "Explore the original product architecture ↓" })).toBeFocused();
});
