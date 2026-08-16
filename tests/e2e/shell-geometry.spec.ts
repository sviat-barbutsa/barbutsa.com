import { expect, test } from "@playwright/test";
import { openShell } from "./actions";
import { waitForFonts } from "./site";

/* Geometry of the terminal line (prompt, reserved height, caret) across the
   supported viewports. Measured after the web font has loaded: the reserved
   height is laid out by CSS from the longest phrase, so measuring against the
   fallback font would test the wrong thing and differ per operating system. */

test("mobile shell input stays on the prompt's first line", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await waitForFonts(page);
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
    await waitForFonts(page);

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
