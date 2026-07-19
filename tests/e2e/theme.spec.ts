import { expect, test, type Page } from "@playwright/test";

async function expectThemeSettled(page: Page): Promise<void> {
  const toggle = page.locator("[data-theme-toggle]");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-motion", "running");
  await expect(toggle).not.toHaveAttribute("aria-disabled", "true");
  await expect(toggle).not.toHaveAttribute("data-busy", "true");
}

test("theme state is accessible, instant under reduced motion, and persistent", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Reflect.set(window, "__themeTransitionCalls", 0);
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: () => {
        const calls = Number(Reflect.get(window, "__themeTransitionCalls"));
        Reflect.set(window, "__themeTransitionCalls", calls + 1);
      },
    });
  });
  await page.goto("/", { waitUntil: "networkidle" });

  const root = page.locator("html");
  const toggle = page.locator("[data-theme-toggle]");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAccessibleName("Switch to light theme");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#141412");

  await toggle.click();
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#ece9e2");
  await expect(page.locator("#theme-status")).toHaveText("light theme active");
  expect(await page.evaluate(() => localStorage.getItem("atlas-theme"))).toBe("light");
  expect(await page.evaluate(() => Reflect.get(window, "__themeTransitionCalls"))).toBe(0);
  await expectThemeSettled(page);

  await page.reload({ waitUntil: "networkidle" });
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("theme follows the OS only while no user preference is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  const root = page.locator("html");
  const toggle = page.locator("[data-theme-toggle]");

  await expect(root).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("atlas-theme"))).toBeNull();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveAttribute("data-theme", "dark");

  await toggle.click();
  await expect(root).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("atlas-theme"))).toBe("light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveAttribute("data-theme", "light");
});

test("valid theme storage changes synchronize to another tab", async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const peer = await context.newPage();
  await peer.emulateMedia({ reducedMotion: "reduce" });
  await peer.goto("/");

  await page.evaluate(() => localStorage.setItem("atlas-theme", "dark"));
  await expect(peer.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(peer.locator("[data-theme-toggle]")).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => localStorage.setItem("atlas-theme", "light"));
  await expect(peer.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(peer.locator("[data-theme-toggle]")).toHaveAttribute("aria-pressed", "false");

  await peer.close();
});

test("theme transition failure commits the fallback and releases busy state", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: () => {
        throw new Error("intentional transition failure");
      },
    });
  });
  await page.goto("/");
  await page.locator("[data-theme-toggle]").click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#theme-status")).toHaveText("light theme active");
  expect(await page.evaluate(() => localStorage.getItem("atlas-theme"))).toBe("light");
  expect(await page.evaluate(() => sessionStorage.getItem("theme-motion-radial-only"))).toBe("1");
  await expectThemeSettled(page);
});
