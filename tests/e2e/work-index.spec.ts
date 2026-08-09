import { expect, test } from "@playwright/test";

const liveTools = [
  { title: "Fractal Builder", kind: "CREATIVE TOOL" },
  { title: "QR Generator", kind: "PRODUCT TOOL" },
  { title: "Semantic Layout Lab", kind: "DEVELOPER TOOL" },
  { title: "Background Removal", kind: "PRODUCT TOOL" },
];
const unfinishedTools = [
  { title: "Hand Detection", kind: "TECHNICAL DEMO" },
  { title: "Typing Lab", kind: "PRODUCT TOOL" },
  { title: "AI Memory Playground", kind: "DEVELOPER WORKBENCH" },
  { title: "Local LLM Workbench", kind: "DEVELOPER WORKBENCH" },
];

test("homepage tools stay live-only while the registry separates kind from development status", async ({ page }) => {
  await page.goto("/");

  const tools = page.getByRole("region", { name: "Software you can use", exact: true });
  const homeRows = tools.locator('[data-layout="work"]');
  await expect(homeRows).toHaveCount(liveTools.length);
  await expect(homeRows.locator(".index-title")).toHaveText(liveTools.map(({ title }) => `${title} ↗`));
  await expect(tools.getByRole("heading", { name: "Hand Detection" })).toHaveCount(0);

  const previewLayers = tools.locator("[data-work-preview] [data-layer]");
  await expect(previewLayers).toHaveCount(2);
  const previewInsets = await previewLayers.evaluateAll((layers) =>
    layers.map((layer) => {
      const style = window.getComputedStyle(layer);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    }),
  );
  const uniqueInsets = new Set(previewInsets.flat());
  expect(uniqueInsets.size).toBe(1);
  const [previewInset] = uniqueInsets;
  expect(Number.parseFloat(previewInset ?? "0")).toBeGreaterThan(0);

  for (const { title, kind } of liveTools) {
    const row = tools.getByRole("heading", { name: `${title} ↗`, exact: true }).locator("xpath=ancestor::a");
    await expect(row.locator(".index-meta")).toContainText(kind);
  }

  await page.goto("/lab");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tools & Experiments");

  for (const { title, kind } of unfinishedTools) {
    const heading = page.getByRole("heading", { name: title, exact: true });
    const row = heading.locator("xpath=ancestor::article");
    await expect(row).toBeVisible();
    await expect(row.getByText("IN DEVELOPMENT", { exact: true })).toBeVisible();
    await expect(row.locator(".index-meta")).toContainText(kind);
    expect(await row.evaluate((element) => element.tagName)).toBe("ARTICLE");
  }

  for (const { title, kind } of liveTools) {
    const heading = page.getByRole("heading", { name: `${title} ↗`, exact: true });
    const row = heading.locator("xpath=ancestor::a");
    await expect(row).toHaveAttribute("target", "_blank");
    await expect(row.getByText("LIVE", { exact: true })).toBeVisible();
    await expect(row.locator(".index-meta")).toContainText(kind);
  }
});
