import { expect, test } from "@playwright/test";
import { openShell } from "./actions";

const liveTools = [
  ["fractal-builder", "https://fractal.barbutsa.com/"],
  ["qr-generator", "https://qr.barbutsa.com/"],
  ["semantic-layout-lab", "https://layout-lab.barbutsa.com/"],
  ["background-removal", "https://bg-removal.barbutsa.com/"],
] as const;

const unavailableTools = ["typing-lab", "hand-detection", "local-llm-workbench"] as const;

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

/* Names inherited from Object.prototype are not commands. Before the own-property
   lookup, `constructor` resolved to a function, fell through to the `say` arm and
   threw inside the typewriter, leaving the doctrine line frozen. */
for (const name of ["constructor", "__proto__"]) {
  test(`shell answers "command not found" for inherited name "${name}"`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const { input } = await openShell(page);
    await input.fill(name);
    await input.press("Enter");

    const output = page.locator("[data-doctrine] [data-typer-text]");
    await expect(output).toContainText(`command not found: ${name}`);
    expect(errors).toEqual([]);
  });
}

/* The easter egg loads its chunk on demand. If the chunk cannot load (offline,
   stale build after a deploy) the shell must say so instead of failing silently
   with an unhandled rejection. */
test("shell answers when the flamenco chunk fails to load", async ({ page }) => {
  const rejections: string[] = [];
  page.on("pageerror", (error) => rejections.push(error.message));
  await page.route(/\/_astro\/flamenco\.[^/]+\.js$/, (route) => route.abort());
  await page.goto("/");
  const { input } = await openShell(page);
  await input.fill(".flamenco");
  await input.press("Enter");

  const output = page.locator("[data-doctrine] [data-typer-text]");
  await expect(output).toContainText(".flamenco: unavailable right now");
  await expect(page.getByRole("dialog", { name: /packet runner/i })).toHaveCount(0);
  expect(rejections).toEqual([]);
});
