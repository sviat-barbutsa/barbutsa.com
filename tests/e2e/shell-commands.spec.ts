import { expect, test } from "@playwright/test";
import { openShell } from "./actions";

const liveTools = [
  ["fractal-builder", "https://fractal.barbutsa.com/"],
  ["qr-generator", "https://qr.barbutsa.com/"],
  ["semantic-layout-lab", "https://layout-lab.barbutsa.com/"],
  ["background-removal", "https://bg-removal.barbutsa.com/"],
] as const;

const unavailableTools = ["typing-lab", "hand-detection", "ai-memory-playground", "local-llm-workbench"] as const;

test("shell lists only tools that are currently live", async ({ page }) => {
  await page.goto("/");
  const { input } = await openShell(page);
  await input.fill("ls tools");
  await input.press("Enter");

  const output = page.locator("[data-doctrine] [data-typer-text]");
  for (const [command] of liveTools) await expect(output).toContainText(command);
  for (const command of unavailableTools) await expect(output).not.toContainText(command);
});

test("every listed tool command opens its real website", async ({ page }) => {
  for (const [command, url] of liveTools) {
    await page.route(`${url}**`, (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Live tool</title>" }),
    );
    await page.goto("/");
    const { input } = await openShell(page);
    await input.fill(command);
    await input.press("Enter");
    await expect(page).toHaveURL(url);
  }
});
