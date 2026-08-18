import { expect, test } from "@playwright/test";

test("dated article rows stay readable on narrow screens", async ({ page }) => {
  for (const width of [320, 375, 435]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/articles");

    const geometry = await page.locator('.index-row[data-layout="dated"]').evaluateAll((rows) =>
      rows.map((row) => {
        const [date, content, meta] = Array.from(row.children);
        const rowBox = row.getBoundingClientRect();
        const dateBox = date.getBoundingClientRect();
        const contentBox = content.getBoundingClientRect();
        const metaBox = meta.getBoundingClientRect();

        return {
          row: { width: rowBox.width },
          date: { y: dateBox.y },
          content: { y: contentBox.y, width: contentBox.width },
          meta: { y: metaBox.y, right: metaBox.right },
        };
      }),
    );

    expect(geometry.length).toBeGreaterThan(4);
    for (const item of geometry) {
      expect(Math.abs(item.date.y - item.meta.y)).toBeLessThan(4);
      expect(item.content.y).toBeGreaterThan(item.date.y);
      expect(item.content.width).toBeGreaterThan(item.row.width * 0.8);
      expect(item.meta.right).toBeLessThanOrEqual(width);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
