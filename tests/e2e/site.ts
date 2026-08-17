import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const PRODUCTION_ORIGIN = "https://barbutsa.com";

/* Public routes deliberately kept out of the sitemap (noindex) that the crawls
   must still cover: they are real production pages. */
export const UNLISTED_ROUTES = ["/styleguide"];

export interface SitemapInventory {
  routes: string[];
  sitemapPaths: string[];
}

async function parseLocations(page: Page, xml: string, expectedRoot: "sitemapindex" | "urlset"): Promise<string[]> {
  return page.evaluate(
    ({ source, rootName }) => {
      const document = new DOMParser().parseFromString(source, "application/xml");
      const parserError = document.querySelector("parsererror")?.textContent;
      if (parserError) throw new Error(`Invalid XML: ${parserError}`);
      if (document.documentElement.localName !== rootName) {
        throw new Error(`Expected <${rootName}>, received <${document.documentElement.localName}>`);
      }
      return Array.from(document.getElementsByTagNameNS("*", "loc"), (node) => node.textContent?.trim() ?? "");
    },
    { source: xml, rootName: expectedRoot },
  );
}

async function getXml(request: APIRequestContext, path: string): Promise<string> {
  const response = await request.get(path);
  expect(response, `${path} should return a successful response`).toBeOK();
  expect(response.headers()["content-type"], `${path} should be XML`).toMatch(/xml/i);
  return response.text();
}

function productionUrl(location: string): URL {
  const url = new URL(location);
  expect(url.origin, `Unexpected sitemap origin for ${location}`).toBe(PRODUCTION_ORIGIN);
  expect(url.search, `Sitemap URLs cannot contain a query: ${location}`).toBe("");
  expect(url.hash, `Sitemap URLs cannot contain a fragment: ${location}`).toBe("");
  expect(url.pathname, `Sitemap URLs cannot use generated HTML suffixes: ${location}`).not.toMatch(/\.html$/);
  return url;
}

export async function loadSitemapInventory(page: Page, request: APIRequestContext): Promise<SitemapInventory> {
  const indexXml = await getXml(request, "/sitemap-index.xml");
  const sitemapLocations = await parseLocations(page, indexXml, "sitemapindex");
  expect(sitemapLocations.length, "The sitemap index should reference at least one sitemap").toBeGreaterThan(0);

  const sitemapPaths = sitemapLocations.map((location) => productionUrl(location).pathname);
  expect(new Set(sitemapPaths).size, "The sitemap index should not contain duplicate entries").toBe(
    sitemapPaths.length,
  );

  const routeLocations: string[] = [];
  for (const sitemapPath of sitemapPaths) {
    const sitemapXml = await getXml(request, sitemapPath);
    routeLocations.push(...(await parseLocations(page, sitemapXml, "urlset")));
  }

  const sitemapRoutes = routeLocations.map((location) => productionUrl(location).pathname);
  expect(sitemapRoutes.length, "The sitemap should contain generated routes").toBeGreaterThan(0);
  expect(new Set(sitemapRoutes).size, "The sitemap should not contain duplicate routes").toBe(sitemapRoutes.length);
  for (const unlisted of UNLISTED_ROUTES) {
    expect(sitemapRoutes, `${unlisted} is noindex and must stay out of the sitemap`).not.toContain(unlisted);
  }
  const routes = [...sitemapRoutes, ...UNLISTED_ROUTES];

  return { routes, sitemapPaths };
}

export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
