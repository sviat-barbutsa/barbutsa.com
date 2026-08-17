import { expect, test, type Page } from "@playwright/test";

function configRow(page: Page, key: string) {
  return page.locator(".conf-row").filter({ has: page.locator("dt", { hasText: new RegExp(`^${key}$`) }) });
}

test("About presents resume-aligned scope without overstating team leadership", async ({ page }) => {
  await page.goto("/about");

  const introduction = page.locator(".about-copy");

  await expect(introduction).toContainText(
    "large enterprise platforms, early-stage products, and smaller client projects",
  );
  await expect(introduction).toContainText("created several web platforms from scratch");
  await expect(introduction).toContainText("products that remain commercially active today");
  await expect(introduction).toContainText("modernize legacy code, improve performance, and keep delivery moving");
  await expect(introduction).toContainText("Most recently, I led frontend architecture");
  await expect(introduction).toContainText("SOLID principles, clear module boundaries, predictable state");
  await expect(introduction).toContainText("Cloudflare Workers, Node.js services, and Python services");
  await expect(introduction).toContainText("RAG, LLM routing, and agentic workflows");
  await expect(introduction).toContainText(
    "I use AI coding tools to accelerate research, implementation, and verification",
  );
  await expect(introduction).toContainText("understand the code before accepting it");
  await expect(introduction).toContainText(
    "led frontend architecture and delivery across product teams of up to seven people",
  );
  await expect(introduction).toContainText("mentored 14 engineers across my career");
  await expect(introduction).not.toContainText("Currently");
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
  await expect(configRow(page, "recent").locator("dd")).toHaveText(
    "frontend architecture · ai-powered collaborative saas · 2020-2026",
  );
  await expect(configRow(page, "current")).toHaveCount(0);

  const proof = configRow(page, "proof").locator("dd");
  await expect(proof).toHaveText("Stack Overflow 5,000+ reputation");
  await expect(page.getByText(/upwork 100% job success/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "UPWORK", exact: true })).toHaveCount(0);

  await expect(page.locator('[data-career-id="fearless-little-2020-2026"] .index-title')).toHaveText(
    "Lead Front-End Developer → Lead Software Engineer responsibilities",
  );

  const credentials = page.locator('[aria-labelledby="h-credentials"]');
  await expect(credentials.getByRole("heading", { name: "Education and selected certifications" })).toBeAttached();
  await expect(credentials).toContainText("Evaluated as equivalent to U.S. M.S. and B.S.");
  await expect(
    credentials.getByRole("link", { name: "Verify credential: Deep Learning Specialization" }),
  ).toHaveAttribute("href", "https://coursera.org/verify/specialization/EFQV27OD8RPL");
  await expect(
    credentials.getByRole("link", {
      name: "Verify credential: CS50's Web Programming with Python and JavaScript",
    }),
  ).toHaveAttribute("href", "https://cs50.harvard.edu/certificates/b2e41973-76aa-4c88-a46a-5d3699d6ec0b");
  await expect(credentials.getByRole("link", { name: "View certificate: CIW JavaScript Specialist" })).toHaveAttribute(
    "href",
    "/certificates/ciw-javascript-specialist.png",
  );

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
});
