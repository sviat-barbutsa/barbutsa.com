import { expect, type Locator, type Page } from "@playwright/test";

export async function openShell(page: Page): Promise<{ input: Locator; opener: Locator }> {
  const opener = page.getByRole("button", { name: /open site command line/i });
  await opener.focus();
  await page.keyboard.press("Enter");
  const input = page.getByLabel("command");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  return { input, opener };
}

export async function launchFlamenco(page: Page): Promise<{ dialog: Locator; opener: Locator }> {
  const knownScripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === "script")
      .map((entry) => entry.name),
  );
  const dynamicChunk = page.waitForResponse(
    (response) => response.request().resourceType() === "script" && !knownScripts.includes(response.url()),
  );
  const { input, opener } = await openShell(page);
  await input.fill(".flamenco");
  await input.press("Enter");
  const dialog = page.getByRole("dialog", { name: /packet runner/i });
  await expect(dialog).toBeVisible();
  expect((await dynamicChunk).ok()).toBe(true);
  return { dialog, opener };
}
