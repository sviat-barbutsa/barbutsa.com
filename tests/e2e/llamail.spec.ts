import { expect, test } from "@playwright/test";

test("Llamail opens a real self-hosted project page instead of a same-page anchor", async ({ page }) => {
  await page.goto("/");

  const llamail = page.locator('[data-flagship-card="llamail-local-ai-email-agent"]');
  await llamail.locator('[data-card-action="primary"]').click();

  await expect(page).toHaveURL(/\/work\/llamail$/);
  await expect(page.getByRole("heading", { level: 1, name: "Llamail" })).toBeVisible();
  await expect(page.locator('[data-case-study="llamail"]')).toBeVisible();
  await expect(page.getByText("Sable is the Telegram interface and operator persona", { exact: false })).toBeVisible();
  await expect(page.getByText("Gmail and Telegram remain external services", { exact: false })).toBeVisible();
  await expect(page.getByText("~3 seconds", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the implementation series →" })).toHaveAttribute(
    "href",
    "/articles/private-local-ai-email-agent",
  );

  const series = page.getByRole("complementary", { name: "Read the five-part Llamail implementation series." });
  await expect(series.getByRole("link")).toHaveCount(5);
  await expect(series.getByRole("link", { name: /Local Hybrid RAG/ })).toHaveAttribute(
    "href",
    "/articles/local-hybrid-rag-chromadb-sqlite-fts5",
  );
  await expect(
    page.locator("main").getByRole("link", { name: /live demo|telegram handle|github|source/i }),
  ).toHaveCount(0);
});
