import { expect, test, type Page } from "@playwright/test";

function configRow(page: Page, key: string) {
  return page.locator(".conf-row").filter({ has: page.locator("dt", { hasText: new RegExp(`^${key}$`) }) });
}

test("About presents resume-aligned scope without overstating team leadership", async ({ page }) => {
  await page.goto("/about");

  const introduction = page.locator(".about-copy");

  await expect(introduction).toContainText("shared UI library and Storybook foundation");
  await expect(introduction).toContainText(
    "from Cloudflare Workers and Node.js to Python services built with FastAPI and Django",
  );
  await expect(introduction).toContainText("four products from empty repos all the way to production");
  await expect(introduction).toContainText("real-time WebSocket collaboration tools");
  await expect(introduction).toContainText("RAG, LLM routing, and agentic workflows using local models");
  await expect(introduction).toContainText(
    "led frontend architecture across teams of up to seven engineers, coordinating closely with backend leads and designers",
  );
  await expect(introduction).toContainText("mentoring 14 engineers along the way");
  await expect(introduction).not.toContainText(/led teams of (?:two|2) to (?:seven|7)/i);

  await expect(configRow(page, "frontend").locator("dd")).toContainText("shared ui · storybook · design systems");
  await expect(configRow(page, "architecture").locator("dd")).toHaveText(
    "state stores · repositories · api adapters · dependency injection",
  );
  await expect(configRow(page, "backend").locator("dd")).toHaveText(
    "cloudflare workers · node.js · python · fastapi · django / drf · rest apis",
  );
  await expect(configRow(page, "leadership").locator("dd")).toHaveText(
    "frontend-led product teams up to 7 · mentored 14 engineers",
  );

  const proof = configRow(page, "proof").locator("dd");
  await expect(proof).toHaveText("Stack Overflow 5,000+ reputation");
  await expect(page.getByText(/upwork 100% job success/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "UPWORK", exact: true })).toHaveCount(0);

  await expect(page.locator('[data-career-id="fearless-little-2020-present"] .index-title')).toHaveText(
    "Lead Front-End Developer → Lead Software Engineer responsibilities",
  );

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
});
