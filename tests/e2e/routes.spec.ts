import { expect, test, type Page } from "@playwright/test";
import { loadSitemapInventory, PRODUCTION_ORIGIN } from "./site";

interface PageInventory {
  assets: string[];
  links: string[];
}

async function collectPageInventory(page: Page): Promise<PageInventory> {
  return page.evaluate(() => {
    const local = (value: string): string | null => {
      const url = new URL(value, location.href);
      return url.origin === location.origin ? `${url.pathname}${url.search}` : null;
    };
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"), (anchor) => local(anchor.href));
    const assets = Array.from(
      document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
        'script[src], link[rel="stylesheet"][href], link[rel="icon"][href], link[rel="preload"][href]',
      ),
      (element) => local(element instanceof HTMLScriptElement ? element.src : element.href),
    );
    return {
      links: links.filter((value): value is string => value !== null),
      assets: assets.filter((value): value is string => value !== null),
    };
  });
}

async function assertNoHorizontalOverflow(page: Page, context: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `${context} overflows horizontally (${dimensions.scrollWidth}px > ${dimensions.clientWidth}px)`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function assertDocument(page: Page, route: string): Promise<PageInventory> {
  await expect(page.locator("main"), `${route} should have one main landmark`).toHaveCount(1);
  await expect(page.locator("h1"), `${route} should have one page heading`).toHaveCount(1);

  expect((await page.title()).trim(), `${route} should have a title`).not.toBe("");
  const description = page.locator('meta[name="description"]');
  await expect(description, `${route} should have one description`).toHaveCount(1);
  expect(
    (await description.getAttribute("content"))?.trim(),
    `${route} should have a nonempty description`,
  ).toBeTruthy();

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical, `${route} should have one canonical URL`).toHaveCount(1);
  const canonicalUrl = new URL((await canonical.getAttribute("href")) ?? "", PRODUCTION_ORIGIN);
  expect(canonicalUrl.origin).toBe(PRODUCTION_ORIGIN);
  expect(canonicalUrl.pathname).toBe(route);
  expect(canonicalUrl.pathname).not.toMatch(/\.html$/);
  expect(canonicalUrl.search).toBe("");
  expect(canonicalUrl.hash).toBe("");

  await assertNoHorizontalOverflow(page, route);

  return collectPageInventory(page);
}

test.describe("production routes", () => {
  test("sitemap routes, metadata, links, assets, and errors are valid", async ({ page, request }) => {
    test.setTimeout(120_000);
    const runtimeErrors: string[] = [];
    const links = new Set<string>();
    const assets = new Set<string>();
    page.on("pageerror", (error) => runtimeErrors.push(`${page.url()}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`${page.url()}: ${message.text()}`);
    });

    const inventory = await loadSitemapInventory(page, request);
    for (const route of inventory.routes) {
      await test.step(route, async () => {
        const response = await page.goto(route, { waitUntil: "load" });
        expect(response, `${route} should produce a navigation response`).not.toBeNull();
        expect(response?.status(), `${route} should return HTTP 200`).toBe(200);
        const pageInventory = await assertDocument(page, route);
        pageInventory.links.forEach((link) => links.add(link));
        pageInventory.assets.forEach((asset) => assets.add(asset));
      });
    }

    for (const link of links) {
      await test.step(`link ${link}`, async () => {
        expect(link).not.toMatch(/\.html(?:\?|$)/);
        expect(await request.get(link), `Internal link ${link} should resolve`).toBeOK();
      });
    }
    for (const asset of assets) {
      await test.step(`asset ${asset}`, async () => {
        expect(await request.get(asset), `Asset ${asset} should resolve`).toBeOK();
      });
    }

    const contentTypes: Record<string, RegExp> = {
      "/rss.xml": /xml/i,
      "/robots.txt": /^text\/plain/i,
      "/favicon.svg": /^image\/svg\+xml/i,
      "/sitemap-index.xml": /xml/i,
    };
    for (const sitemapPath of inventory.sitemapPaths) contentTypes[sitemapPath] = /xml/i;
    for (const [path, expectedType] of Object.entries(contentTypes)) {
      const response = await request.get(path);
      expect(response, `${path} should resolve`).toBeOK();
      expect(response.headers()["content-type"], `${path} should have the expected content type`).toMatch(expectedType);
    }
    expect(runtimeErrors).toEqual([]);

    const missingPath = "/__route-that-does-not-exist__";
    const missing = await page.goto(missingPath, { waitUntil: "load" });
    expect(missing?.status()).toBe(404);
    await expect(page).toHaveTitle(/404/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This path is outside the current map.");
    await expect(page.getByRole("link", { name: /back to origin/i })).toHaveAttribute("href", "/");
    await expect(page.locator("main")).toHaveCount(1);
    const unexpected404Errors = runtimeErrors.filter(
      (error) => !(error.includes(missingPath) && /failed to load resource.+404/i.test(error)),
    );
    expect(unexpected404Errors).toEqual([]);
  });

  test("routes reflow at narrow and enlarged-text settings", async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "One browser project covers viewport-independent reflow");
    test.setTimeout(120_000);

    const { routes } = await loadSitemapInventory(page, request);
    const modes = [
      { name: "320 CSS-pixel viewport", width: 320, rootFontSize: null },
      { name: "200% root font", width: 1280, rootFontSize: "200%" },
    ];

    for (const mode of modes) {
      await page.setViewportSize({ width: mode.width, height: 900 });
      for (const route of routes) {
        await test.step(`${mode.name}: ${route}`, async () => {
          await page.goto(route, { waitUntil: "load" });
          if (mode.rootFontSize) {
            await page.addStyleTag({ content: `html { font-size: ${mode.rootFontSize} !important; }` });
          }
          await assertNoHorizontalOverflow(page, `${route} at ${mode.name}`);
        });
      }
    }
  });
});
