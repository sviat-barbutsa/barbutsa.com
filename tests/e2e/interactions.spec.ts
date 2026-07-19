import { expect, test } from "@playwright/test";
import { openShell } from "./actions";

test("X-ray state opens, pins, closes, and survives only the session", async ({ page }) => {
  await page.goto("/");
  const root = page.locator("html");
  const footerToggle = page.locator("footer [data-xray-toggle]");
  const legend = page.locator(".xray-legend");

  await footerToggle.click();
  await expect(root).toHaveAttribute("data-xray", "");
  await expect(footerToggle).toHaveAttribute("aria-pressed", "true");
  await expect(legend).toBeVisible();
  await expect(legend).toHaveAttribute("data-pin", "bottom");
  await legend.locator("[data-xray-pin]").click();
  await expect(legend).toHaveAttribute("data-pin", "top");

  await page.goto("/about");
  await expect(root).toHaveAttribute("data-xray", "");
  await expect(legend).toHaveAttribute("data-pin", "top");
  await legend.locator("[data-xray-toggle]").click();
  await expect(root).not.toHaveAttribute("data-xray", "");
  await expect(footerToggle).toHaveAttribute("aria-pressed", "false");
  await expect(legend).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("atlas-xray"))).toBeNull();

  await page.reload();
  await expect(root).not.toHaveAttribute("data-xray", "");
});

test("skip link, keyboard navigation, and aria-current state are correct", async ({ page }) => {
  await page.goto("/");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#main$/);
  await expect(page.locator("#main")).toBeFocused();

  const articles = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Articles" });
  await articles.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/articles$/);
  const active = page.locator('nav[aria-label="Main"] [aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", "/articles");

  await page.goto("/articles/three-tier-memory-system-for-ai-coding");
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", "/articles");
});

test("shell commands close cleanly and Escape restores the opener", async ({ page }) => {
  await page.goto("/");
  const first = await openShell(page);
  await first.input.fill("whoami");
  await first.input.press("Enter");
  await expect(page.getByLabel("command")).toHaveCount(0);
  await expect(page.locator("#theme-status")).toContainText("Sviatoslav Barbutsa");
  await expect(page.locator("[data-doctrine] .typeline")).not.toHaveAttribute("data-shell-open", "");

  const second = await openShell(page);
  await second.input.press("Escape");
  await expect(page.getByLabel("command")).toHaveCount(0);
  await expect(second.opener).toBeFocused();
});
