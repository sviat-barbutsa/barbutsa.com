import { expect, test } from "@playwright/test";

test("recent commercial work leads the portfolio with generalized evidence", async ({ page }) => {
  await page.goto("/");

  const card = page.locator('[data-flagship-card="collaborative-saas-frontend-platform"]');
  await expect(card).toHaveAttribute("data-tier", "featured");
  await expect(card.getByText("RECENT COMMERCIAL WORK · 2020–2026", { exact: true })).toBeVisible();
  await expect(card.getByText("NDA-PROTECTED", { exact: true })).toBeVisible();
  await expect(card.getByRole("heading", { name: "Collaborative SaaS Frontend Platform" })).toBeVisible();
  await expect(card).toContainText("Frontend architecture, major implementation, and team mentorship");
  await expect(card.locator('figure[data-media="scope"]')).toHaveAttribute("aria-label", /Generalized architecture/);
  await expect(card.locator("img")).toHaveAttribute("src", "/work/collaborative-saas-scope.svg");
  await expect(card.locator("source[media='(max-width: 40em)']")).toHaveAttribute(
    "srcset",
    "/work/collaborative-saas-scope-mobile.svg",
  );
  await expect(card.locator("img")).toHaveAttribute("alt", /Generalized engineering scope/);
  await expect(card.locator('[data-card-action="primary"]')).toHaveAttribute(
    "href",
    "/work/collaborative-saas-frontend-platform",
  );
});

test("commercial SaaS case study states ownership without exposing the product", async ({ page }) => {
  await page.goto("/work/collaborative-saas-frontend-platform");

  await expect(page).toHaveTitle("Collaborative SaaS Frontend Platform | Sviatoslav Barbutsa");
  const main = page.locator("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText("Collaborative SaaS Frontend Platform");
  await expect(main).toContainText("I established and owned the frontend architecture");
  await expect(main).toContainText("personally implemented the foundation and major product areas");
  await expect(main).toContainText("mentored frontend engineers");
  await expect(main).toContainText("worked on several client projects");
  await expect(main).toContainText("React Native and React Native Web");
  await expect(main.locator(".case-study-hero .kick")).toContainText("Commercial role · 2020–2026");
  await expect(main).toContainText("1.5 seconds to 0.4 seconds");
  await expect(main.getByRole("img", { name: /Generalized engineering scope/ })).toBeVisible();
  await expect(main.locator(".case-study-hero-media figcaption")).toContainText("Generalized engineering scope");
  await expect(main.locator(".case-study-boundary .idx")).toHaveText("02");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /collaborative-saas-og-1200x630\.png$/,
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /collaborative-saas-og-1200x630\.png$/,
  );

  const publicText = (await main.innerText()).toLowerCase();
  expect(publicText).not.toMatch(
    /fearless little|10x web|cloudflare workers microservices|429 non-merge|self-funded|owner funded/,
  );
});

test("commercial SaaS case study remains readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/work/collaborative-saas-frontend-platform");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Discuss this work →" })).toHaveAttribute("href", "/contact");
  await expect(page.locator(".case-study-hero-media source[media='(max-width: 40em)']")).toHaveAttribute(
    "srcset",
    "/work/collaborative-saas-scope-case-mobile.svg",
  );
  expect(
    await page.locator(".case-study-hero-media img").evaluate((image) => (image as HTMLImageElement).currentSrc),
  ).toMatch(/collaborative-saas-scope-case-mobile\.svg$/);
  const heroImage = await page.locator(".case-study-hero-media img").boundingBox();
  expect(heroImage).not.toBeNull();
  expect(heroImage!.height).toBeGreaterThan(350);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
