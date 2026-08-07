import { expect, test } from "@playwright/test";

const liveLabs = ["Fractal Builder", "QR Generator", "Semantic Layout Lab", "Background Removal"];
const unfinishedLabs = ["Hand Detection", "Typing Lab", "AI Memory Playground", "Local LLM Workbench"];

test("selected work stays live-only while the lab registry keeps transparent development status", async ({ page }) => {
  await page.goto("/");

  const selectedWork = page.getByRole("region", { name: "Selected work" });
  const homeRows = selectedWork.locator('[data-layout="work"]');
  await expect(homeRows).toHaveCount(liveLabs.length);
  await expect(homeRows.locator(".index-title")).toHaveText(liveLabs.map((title) => `${title} ↗`));
  await expect(selectedWork.getByRole("heading", { name: "Hand Detection" })).toHaveCount(0);

  await page.goto("/lab");

  for (const title of unfinishedLabs) {
    const heading = page.getByRole("heading", { name: title, exact: true });
    const row = heading.locator("xpath=ancestor::article");
    await expect(row).toBeVisible();
    await expect(row.getByText("IN DEVELOPMENT", { exact: true })).toBeVisible();
    expect(await row.evaluate((element) => element.tagName)).toBe("ARTICLE");
  }

  for (const title of liveLabs) {
    const heading = page.getByRole("heading", { name: `${title} ↗`, exact: true });
    const row = heading.locator("xpath=ancestor::a");
    await expect(row).toHaveAttribute("target", "_blank");
    await expect(row.getByText("LIVE", { exact: true })).toBeVisible();
  }
});
