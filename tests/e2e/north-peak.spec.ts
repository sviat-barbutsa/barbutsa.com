import { expect, test } from "@playwright/test";

test("North Peak card exposes the case study and live website", async ({ page }) => {
  await page.goto("/");

  const northPeak = page.locator('[data-flagship-card="north-peak-appliance-repair"]');
  await expect(northPeak).toHaveAttribute("data-tier", "supporting");
  await expect(northPeak.getByText("CLIENT SITE · WORDPRESS · 2026", { exact: true })).toBeVisible();
  await expect(northPeak.getByText("LIVE CLIENT WEBSITE", { exact: true })).toBeVisible();
  await expect(northPeak.locator(".flagship-tech")).toHaveText("WordPress · PHP · JavaScript");
  await expect(northPeak.locator("img")).toHaveAttribute("src", "/work/north-peak/north-peak-homepage-showcase.png");
  await expect(northPeak.locator('[data-card-action="primary"]')).toHaveAttribute(
    "href",
    "/work/north-peak-appliance-repair",
  );

  const liveWebsite = northPeak.getByRole("link", { name: "Visit live website ↗" });
  await expect(liveWebsite).toHaveAttribute("href", "https://northpeakfastrepair.com/");
  await expect(liveWebsite).toHaveAttribute("target", "_blank");
  await expect(liveWebsite).toHaveAttribute("rel", "noopener noreferrer");
});

test("North Peak publishes a public-safe responsive client-delivery case study", async ({ page }) => {
  await page.goto("/work/north-peak-appliance-repair");

  await expect(page.getByRole("heading", { level: 1, name: "North Peak Appliance Repair" })).toBeVisible();
  await expect(page.getByText("LIVE CLIENT WEBSITE", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Project facts" })).toContainText("Commissioned client delivery");
  await expect(
    page.getByRole("heading", { name: "A service journey built around the next useful action." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Responsive pages from the live client website." })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /commissioned WordPress delivery/i);

  const images = page.locator('[data-case-study="north-peak-appliance-repair"] img');
  await expect(images).toHaveCount(4);
  expect(
    await images.evaluateAll((items) => items.every((item) => /North Peak/i.test(item.getAttribute("alt") ?? ""))),
  ).toBe(true);
  await expect(page.locator("main")).not.toContainText(/\(555\)|Huston/i);

  const publicPreview = page.getByRole("link", { name: "Visit live website ↗" });
  await expect(publicPreview).toHaveAttribute("href", "https://northpeakfastrepair.com/");
  await expect(publicPreview).toHaveAttribute("target", "_blank");
  await expect(publicPreview).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("link", { name: "northpeakfastrepair.com ↗" })).toHaveAttribute(
    "href",
    "https://northpeakfastrepair.com/",
  );
  await expect(page.locator("main")).not.toContainText(
    /conversion rate|increased traffic|generated \d+ leads|\$\d+.*revenue/i,
  );
});
