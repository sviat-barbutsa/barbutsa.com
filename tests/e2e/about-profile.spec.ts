import { expect, test, type Page } from "@playwright/test";

const expectedUpworkHref = "https://www.upwork.com/freelancers/~013ff3b6a6623f2810";

function configRow(page: Page, key: string) {
  return page.locator(".conf-row").filter({ has: page.locator("dt", { hasText: new RegExp(`^${key}$`) }) });
}

test("About presents resume-aligned scope without overstating team leadership", async ({ page }) => {
  await page.goto("/about");

  const introduction = page.locator(".about-copy");

  await expect(introduction).toContainText("shared UI library and Storybook foundation");
  await expect(introduction).toContainText(
    "Cloudflare Workers and Durable Objects, Node.js, Python, FastAPI, Django/DRF, and REST APIs",
  );
  await expect(introduction).toContainText("real-time collaboration over WebSockets");
  await expect(introduction).toContainText("RAG and vector search, LLM routing, agentic workflows, and local models");
  await expect(introduction).toContainText(
    "I led frontend architecture and delivery across product teams of up to seven, coordinating frontend engineers, backend contributors, and design",
  );
  await expect(introduction).toContainText(
    "Across my career, I mentored 14 engineers and owned production quality for the systems I led",
  );
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
  await expect(page.getByRole("link", { name: "UPWORK", exact: true })).toHaveAttribute("href", expectedUpworkHref);

  await expect(page.locator('[data-career-id="fearless-little-2020-present"] .index-title')).toHaveText(
    "Lead Front-End Developer → Lead Software Engineer responsibilities",
  );

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
});
