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

  const mobileMenu = page.locator("[data-site-menu-toggle]");
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  const writing = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Writing" });
  await writing.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/articles$/);
  const active = page.locator('nav[aria-label="Main"] [aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", "/articles");

  await page.goto("/articles/three-tier-memory-system-for-ai-coding");
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", "/articles");
});

test("mobile primary menu exposes every route and closes predictably", async ({ page }) => {
  const menu = page.locator("[data-site-menu-toggle]");
  const nav = page.getByRole("navigation", { name: "Main" });

  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toBeHidden();

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toHaveAttribute("aria-label", "Close main menu");
    await expect(nav).toBeVisible();

    for (const label of ["Home", "Work", "Writing", "Tools", "About", "Contact"]) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box, `${label} should have a rendered touch target at ${width}px`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  }

  await menu.click();
  await page.mouse.click(380, 800);
  await expect(nav).toBeHidden();

  await menu.click();
  await nav.getByRole("link", { name: "Writing", exact: true }).click();
  await expect(page).toHaveURL(/\/articles$/);
  await expect(page.locator('nav[aria-label="Main"] [aria-current="page"]')).toHaveAttribute("href", "/articles");

  await page.setViewportSize({ width: 768, height: 844 });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(nav.getByRole("link", { name: "Contact", exact: true })).toBeVisible();

  await page.setViewportSize({ width: 900, height: 844 });
  await expect(menu).toBeHidden();
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Contact", exact: true })).toBeVisible();
});

test("shell exposes the new destinations and preserves legacy route aliases", async ({ page }) => {
  for (const [command, route] of [
    ["work", "/work"],
    ["writing", "/articles"],
    ["tools", "/lab"],
    ["lab", "/lab"],
    ["labs", "/lab"],
    ["packages", "/packages"],
  ] as const) {
    await page.goto("/");
    const { input } = await openShell(page);
    await input.fill(command);
    await input.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${route}$`));
  }
});

test("shell commands close cleanly and Escape restores the opener", async ({ page }) => {
  await page.goto("/");
  const first = await openShell(page);
  await first.input.fill("whoami");
  await first.input.press("Enter");
  await expect(page.getByLabel("command", { exact: true })).toHaveCount(0);
  await expect(page.locator("#theme-status")).toContainText("Sviatoslav Barbutsa");
  await expect(page.locator("[data-doctrine] .typeline")).not.toHaveAttribute("data-shell-open", "");

  const second = await openShell(page);
  await second.input.press("Escape");
  await expect(page.getByLabel("command", { exact: true })).toHaveCount(0);
  await expect(second.opener).toBeFocused();
});

test("mobile shell input stays on the prompt's first line", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const { input } = await openShell(page);
    await input.fill("dfsd");

    const geometry = await page.evaluate(() => {
      const prompt = document.querySelector<HTMLElement>("[data-doctrine] .prompt");
      const line = document.querySelector<HTMLElement>("[data-doctrine] .line");
      const input = document.querySelector<HTMLInputElement>("[data-doctrine] .shell-input");
      if (!prompt || !line || !input) throw new Error("Shell geometry is unavailable.");
      const promptBox = prompt.getBoundingClientRect();
      const lineBox = line.getBoundingClientRect();
      const inputBox = input.getBoundingClientRect();
      return {
        promptTop: promptBox.top,
        promptHeight: promptBox.height,
        lineBoxHeight: lineBox.height,
        inputTop: inputBox.top,
        inputHeight: inputBox.height,
      };
    });

    expect(geometry.promptHeight).toBe(20);
    expect(geometry.lineBoxHeight).toBe(40);
    expect(Math.abs(geometry.inputTop - geometry.promptTop)).toBeLessThan(1);
    expect(geometry.inputHeight).toBe(20);
    await input.press("Escape");
  }
});

test("terminal output caret aligns with the prompt glyph across mobile and desktop", async ({ page }) => {
  for (const { width, height, reservedHeight } of [
    { width: 375, height: 667, reservedHeight: 40 },
    { width: 390, height: 844, reservedHeight: 40 },
    { width: 320, height: 844, reservedHeight: 40 },
    { width: 1440, height: 1000, reservedHeight: 20 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");

    const readGeometry = () =>
      page.evaluate(() => {
        const root = document.querySelector<HTMLElement>("[data-doctrine] .typeline");
        const line = document.querySelector<HTMLElement>("[data-doctrine] .line");
        const prompt = document.querySelector<HTMLElement>("[data-doctrine] .prompt");
        const text = document.querySelector<HTMLElement>("[data-doctrine] [data-typer-text]");
        const caret = document.querySelector<HTMLElement>("[data-doctrine] .caret");
        if (!root || !line || !prompt || !text || !caret) {
          throw new Error("Terminal output geometry is unavailable.");
        }

        const baselineProbe = document.createElement("span");
        baselineProbe.setAttribute("aria-hidden", "true");
        baselineProbe.style.cssText =
          "display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline";
        prompt.append(baselineProbe);
        const baseline = baselineProbe.getBoundingClientRect().bottom;
        baselineProbe.remove();

        const style = getComputedStyle(prompt);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas text metrics are unavailable.");
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const dollar = context.measureText("$");
        const dollarTop = baseline - dollar.actualBoundingBoxAscent;
        const dollarBottom = baseline + dollar.actualBoundingBoxDescent;
        const caretBox = caret.getBoundingClientRect();
        const textRange = document.createRange();
        textRange.selectNodeContents(text);
        const textRects = Array.from(textRange.getClientRects());
        const lastTextBox = textRects[textRects.length - 1] ?? null;
        return {
          rootHeight: root.getBoundingClientRect().height,
          lineHeight: Number.parseFloat(getComputedStyle(root).lineHeight),
          lineBoxHeight: line.getBoundingClientRect().height,
          centerDelta: (caretBox.top + caretBox.bottom) / 2 - (dollarTop + dollarBottom) / 2,
          bottomDelta: caretBox.bottom - dollarBottom,
          textCenterDelta: lastTextBox
            ? (caretBox.top + caretBox.bottom) / 2 - (lastTextBox.top + lastTextBox.bottom) / 2
            : null,
          textBottomDelta: lastTextBox ? caretBox.bottom - lastTextBox.bottom : null,
        };
      });

    const ambientGeometry = await readGeometry();
    expect(ambientGeometry.centerDelta).toBeGreaterThanOrEqual(-0.75);
    expect(ambientGeometry.centerDelta).toBeLessThanOrEqual(-0.5);
    expect(ambientGeometry.bottomDelta).toBeGreaterThanOrEqual(-1.25);
    expect(ambientGeometry.bottomDelta).toBeLessThanOrEqual(-1);

    const { input } = await openShell(page);
    await input.fill("list");
    await input.press("Enter");

    const answer = page.locator("[data-doctrine] [data-typer-text]");
    await expect(answer).toContainText("try help");
    const geometry = await readGeometry();

    expect(geometry.lineHeight).toBe(20);
    expect(geometry.rootHeight).toBe(reservedHeight);
    expect(geometry.lineBoxHeight).toBe(reservedHeight);
    expect(geometry.textCenterDelta).not.toBeNull();
    expect(geometry.textBottomDelta).not.toBeNull();
    expect(Math.abs(geometry.textCenterDelta!)).toBeLessThanOrEqual(1.25);
    expect(geometry.textBottomDelta!).toBeLessThan(0);
  }
});
