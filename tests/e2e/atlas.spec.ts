import { expect, test } from "@playwright/test";

test("Atlas tooltips work with pointer and keyboard", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "Pointer hover is a desktop interaction");
  await page.goto("/");
  const tip = page.locator("[data-atlas-tip]");

  const warsawHalo = page.locator('[data-code="WAW"] circle.halo');
  await warsawHalo.scrollIntoViewIfNeeded();
  const haloBox = await warsawHalo.boundingBox();
  expect(haloBox).not.toBeNull();
  await page.mouse.move((haloBox?.x ?? 0) + (haloBox?.width ?? 0) / 2, (haloBox?.y ?? 0) + (haloBox?.height ?? 0) / 2);
  await expect(tip).toHaveClass(/show/);
  await expect(tip).toHaveAttribute("aria-hidden", "false");
  await expect(tip).toContainText("Warsaw · edge PoP");
  await page.mouse.move(0, 0);
  await expect(tip).toHaveAttribute("aria-hidden", "true");

  const london = page.locator('[data-code="LHR"]');
  await london.focus();
  await expect(tip).toContainText("London · edge PoP");
  await london.evaluate((node) => (node as SVGGElement).blur());
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
