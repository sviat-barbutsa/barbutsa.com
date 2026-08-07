import { expect, test } from "@playwright/test";

test("Atlas tooltips work with pointer and keyboard", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "Pointer hover is a desktop interaction");
  await page.goto("/");
  const tip = page.locator("[data-atlas-tip]");

  const warsaw = page.locator('[data-code="WAW"]');
  const warsawHalo = warsaw.locator("circle.halo");
  const warsawCore = warsaw.locator("circle.core");
  await warsawHalo.scrollIntoViewIfNeeded();
  const haloBox = await warsawHalo.boundingBox();
  const coreBox = await warsawCore.boundingBox();
  expect(haloBox).not.toBeNull();
  expect(coreBox).not.toBeNull();
  const coreRight = (coreBox?.x ?? 0) + (coreBox?.width ?? 0);
  const haloRight = (haloBox?.x ?? 0) + (haloBox?.width ?? 0);
  await page.mouse.move(coreRight + (haloRight - coreRight) / 2, (haloBox?.y ?? 0) + (haloBox?.height ?? 0) / 2);
  await expect(tip).toHaveClass(/show/);
  await expect(tip).toHaveAttribute("aria-hidden", "false");
  await expect(tip).toContainText("Warsaw · edge PoP");
  await page.mouse.move(0, 0);
  await expect(tip).toHaveAttribute("aria-hidden", "true");

  await warsaw.locator("text").hover();
  await expect(tip).toContainText("Warsaw · edge PoP");
  await page.mouse.move(0, 0);
  await expect(tip).toHaveAttribute("aria-hidden", "true");

  const london = page.locator('[data-code="LHR"]');
  await london.focus();
  await expect(tip).toContainText("London · edge PoP");
  await london.evaluate((node) => (node as SVGGElement).blur());
  await expect(tip).toHaveAttribute("aria-hidden", "true");

  await london.focus();
  await london.press("Enter");
  await expect(london).toHaveAttribute("aria-pressed", "true");
  await london.press("Enter");
  await expect(london).toHaveAttribute("aria-pressed", "false");
  await expect(tip).toHaveAttribute("aria-hidden", "true");
});

test("Atlas node taps pin, switch, and dismiss tooltips", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch pinning is a coarse-pointer interaction");
  await page.goto("/");

  const frame = page.locator("[data-atlas-frame]");
  const svg = frame.locator("[data-atlas-svg]");
  const tip = frame.locator("[data-atlas-tip]");
  const warsaw = svg.locator('[data-code="WAW"]');
  const london = svg.locator('[data-code="LHR"]');

  await expect(svg).toHaveAttribute("role", "group");
  await expect(warsaw).toHaveAttribute("role", "button");
  await expect(warsaw).toHaveAttribute("aria-pressed", "false");
  await expect(warsaw).toHaveAttribute("aria-describedby", "atlas-tip");

  const targetStyle = await warsaw.locator("circle.tap-target").evaluate((node) => {
    const style = getComputedStyle(node);
    return { strokeWidth: style.strokeWidth, touchAction: style.touchAction, vectorEffect: style.vectorEffect };
  });
  expect(targetStyle).toEqual({ strokeWidth: "44px", touchAction: "manipulation", vectorEffect: "non-scaling-stroke" });

  const haloBox = await warsaw.locator("circle.halo").boundingBox();
  expect(haloBox).not.toBeNull();
  const tapX = (haloBox?.x ?? 0) + (haloBox?.width ?? 0) / 2 + 18;
  const tapY = (haloBox?.y ?? 0) + (haloBox?.height ?? 0) / 2;

  await page.touchscreen.tap(tapX, tapY);
  await expect(tip).toHaveClass(/show/);
  await expect(tip).toContainText("Warsaw · edge PoP");
  await expect(warsaw).toHaveAttribute("aria-pressed", "true");

  await page.touchscreen.tap(tapX, tapY);
  await expect(tip).toHaveAttribute("aria-hidden", "true");
  await expect(warsaw).toHaveAttribute("aria-pressed", "false");

  await page.touchscreen.tap(tapX, tapY);
  await london.locator("circle.core").tap();
  await expect(tip).toContainText("London · edge PoP");
  await expect(warsaw).toHaveAttribute("aria-pressed", "false");
  await expect(london).toHaveAttribute("aria-pressed", "true");

  await frame.locator(".atlas-meta").tap();
  await expect(tip).toHaveAttribute("aria-hidden", "true");
  await expect(london).toHaveAttribute("aria-pressed", "false");

  await london.locator("circle.core").tap();
  await page.keyboard.press("Escape");
  await expect(tip).toHaveAttribute("aria-hidden", "true");
});

test("reduced-motion Atlas renders the complete static route", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const geometry = await page.locator("[data-route]").evaluate((node) => {
    const route = node as SVGPathElement;
    const length = route.getTotalLength();
    const [drawn = 0, dashLength = 0] = route.style.strokeDasharray.split(/[ ,]+/).map(Number);
    const endpoint = route.getPointAtLength(length);
    const pulse = document.querySelector<SVGCircleElement>("[data-pulse]");
    return {
      dashLength,
      drawn,
      endpointX: endpoint.x,
      endpointY: endpoint.y,
      length,
      pulseX: Number(pulse?.getAttribute("cx")),
      pulseY: Number(pulse?.getAttribute("cy")),
    };
  });
  expect(Math.abs(geometry.drawn - geometry.length)).toBeLessThan(0.5);
  expect(Math.abs(geometry.dashLength - geometry.length)).toBeLessThan(0.5);
  expect(Math.abs(geometry.pulseX - geometry.endpointX)).toBeLessThan(0.5);
  expect(Math.abs(geometry.pulseY - geometry.endpointY)).toBeLessThan(0.5);
  await expect(page.locator("[data-route]")).toHaveClass(/on/);
  await expect(page.locator('[data-code="WAW"]')).toHaveClass(/hot/);
});
