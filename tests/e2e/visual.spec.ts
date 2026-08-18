import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { waitForFonts } from "./site";

type Theme = "light" | "dark";

async function prepare(page: Page, route: string, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.addInitScript((storedTheme) => localStorage.setItem("atlas-theme", storedTheme), theme);
  await page.goto(route, { waitUntil: "networkidle" });
  await waitForFonts(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

function requireProject(testInfo: TestInfo, project: "chromium-desktop" | "chromium-mobile"): void {
  test.skip(testInfo.project.name !== project, `Snapshot belongs to ${project}`);
}

async function prepareHomepageMedia(page: Page): Promise<void> {
  const images = page.locator('[data-home-section="selected-work"] img');
  await images.last().scrollIntoViewIfNeeded();
  await expect
    .poll(() => images.evaluateAll((nodes) => nodes.every((node) => (node as HTMLImageElement).naturalWidth > 0)))
    .toBe(true);
  await images.evaluateAll(async (nodes) => {
    await Promise.all(nodes.map((node) => (node as HTMLImageElement).decode()));
  });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.locator('[data-home-section="selected-work"]').screenshot({ animations: "disabled" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

const screenshotOptions = {
  animations: "disabled" as const,
  caret: "hide" as const,
  fullPage: true,
  style: `
    [data-pulse],
    astro-dev-toolbar,
    [data-astro-dev-toolbar] {
      visibility: hidden !important;
    }
  `,
};

test.describe("visual regression", () => {
  test("homepage desktop explicit dark", async ({ page }, testInfo) => {
    requireProject(testInfo, "chromium-desktop");
    await prepare(page, "/", "dark");
    await prepareHomepageMedia(page);
    await expect(page).toHaveScreenshot("home-desktop-dark.png", {
      ...screenshotOptions,
      mask: [page.locator(".status-bar"), page.locator("[data-doctrine]"), page.locator(".readout")],
    });
  });

  test("homepage mobile explicit light", async ({ page }, testInfo) => {
    requireProject(testInfo, "chromium-mobile");
    await prepare(page, "/", "light");
    await prepareHomepageMedia(page);
    await expect(page).toHaveScreenshot("home-mobile-light.png", {
      ...screenshotOptions,
      mask: [page.locator("[data-doctrine]"), page.locator(".readout")],
    });
  });

  test("article archive desktop", async ({ page }, testInfo) => {
    requireProject(testInfo, "chromium-desktop");
    await prepare(page, "/articles", "dark");
    await expect(page).toHaveScreenshot("articles-desktop-dark.png", {
      ...screenshotOptions,
      mask: [page.locator("[data-sb-clock]"), page.locator("[data-sb-colo]")],
    });
  });

  test("contact mobile shared layout", async ({ page }, testInfo) => {
    requireProject(testInfo, "chromium-mobile");
    await prepare(page, "/contact", "light");
    await expect(page).toHaveScreenshot("contact-mobile-light.png", screenshotOptions);
  });
});
