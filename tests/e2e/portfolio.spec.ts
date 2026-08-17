import { expect, test } from "@playwright/test";
import { waitForFonts } from "./site";

test("flagship work publishes only cleared evidence and leads into live software", async ({ page }) => {
  await page.goto("/");

  const sectionOrder = await page
    .locator("main > [data-home-section]")
    .evaluateAll((sections) => sections.map((section) => section.getAttribute("data-home-section")));
  expect(sectionOrder).toEqual(["hero", "selected-work", "tools", "writing", "contact"]);

  const selected = page.getByRole("region", { name: "Selected Product Work", exact: true });
  const cards = selected.locator("[data-flagship-card]");
  await expect(cards).toHaveCount(6);
  await expect(cards.locator("h3")).toHaveText([
    "English Voice Coach",
    "Llamail",
    "EazeGames",
    "Piggy.eu",
    "Zharwing Memory",
    "North Peak Appliance Repair",
  ]);
  await expect(selected.locator('[data-flagship-card][data-tier="featured"]')).toHaveCount(2);
  await expect(selected.locator('[data-flagship-card][data-tier="supporting"]')).toHaveCount(4);
  await expect(cards.locator('[data-card-action="primary"]')).toHaveCount(6);
  await expect(cards.locator('[data-card-action="primary"].btn')).toHaveCount(6);
  await expect(cards.locator('[data-card-action="media"]')).toHaveCount(6);
  expect(
    await cards
      .locator(".flagship-summary")
      .evaluateAll((items) => items.every((item) => item.scrollHeight <= item.clientHeight)),
  ).toBe(true);
  await expect(selected.locator(".flagship-availability, .flagship-context, .flagship-media-caption")).toHaveCount(0);
  await expect(selected.getByText("INDEPENDENT PRODUCT · ANDROID · 2026", { exact: true })).toBeVisible();
  await expect(selected.getByText("PRIVATE RELEASE CANDIDATE", { exact: true })).toBeVisible();
  await expect(selected.getByText("INDEPENDENT SYSTEM · LOCAL-FIRST AI", { exact: true })).toBeVisible();
  await expect(selected.getByText("ARCHIVE · WEB PLATFORM · 2016–17", { exact: true })).toBeVisible();
  await expect(selected.getByText("OPEN SOURCE · LOCAL-FIRST · DEVELOPER PREVIEW", { exact: true })).toBeVisible();
  await expect(selected.getByText("Real-Time Collaborative SaaS Architecture", { exact: true })).toHaveCount(0);
  await expect(selected.getByRole("link", { name: /live demo|telegram|github|source/i })).toHaveCount(0);

  const voiceCoach = selected.locator('[data-flagship-card="english-voice-coach"]');
  await expect(voiceCoach.getByText("Designed and implemented end-to-end", { exact: true })).toBeVisible();
  await expect(voiceCoach.locator(".flagship-tech")).toHaveText("Flutter · whisper.cpp · On-device AI");
  await expect(voiceCoach.locator('[data-card-action="primary"]')).toHaveAttribute("href", "/work/english-voice-coach");
  await expect(voiceCoach.locator('[data-card-action="media"]')).toHaveAttribute("href", "/work/english-voice-coach");

  const llamail = selected.locator('[data-flagship-card="llamail-local-ai-email-agent"]');
  await expect(llamail.locator(".flagship-tech")).toHaveText("Python · FastAPI · llama.cpp");
  await expect(llamail.locator('[data-card-action="primary"]')).toHaveAttribute("href", "/work/llamail");
  await expect(llamail.locator('[data-card-action="related"]')).toHaveCount(0);

  const memory = selected.locator('[data-flagship-card="zharwing-memory"]');
  await expect(memory).toHaveAttribute("data-tier", "supporting");
  await expect(
    memory.getByText("Implemented the Tauri app, TypeScript core, and MCP server", { exact: true }),
  ).toBeVisible();
  await expect(memory.locator(".flagship-tech")).toHaveText("TypeScript · Tauri · MCP");
  await expect(memory.locator('figure[data-media="product"]')).toBeVisible();
  await expect(memory.locator("img")).toHaveAttribute("src", "/work/zharwing-memory/zharwing-memory-dashboard.png");
  await expect(memory.locator("img")).toHaveAttribute("alt", /fictional EchoDesk project/);
  const memoryAction = memory.getByRole("link", { name: "View project ↗" });
  await expect(memoryAction).toHaveAttribute("href", "https://zharwing.barbutsa.com/memory/");
  await expect(memoryAction).toHaveAttribute("target", "_blank");
  await expect(memoryAction).toHaveAttribute("rel", "noopener noreferrer");

  await expect(voiceCoach.locator("img")).toHaveCount(2);
  const objectFits = await selected
    .locator(".flagship-media img")
    .evaluateAll((images) => images.map((image) => getComputedStyle(image).objectFit));
  expect(objectFits).toEqual(["contain", "contain", "cover", "cover", "cover", "cover", "cover"]);
  await expect(selected.locator(".flagship-route")).toContainText("TELEGRAM");
  await expect(selected.locator(".flagship-route")).toContainText("LOCAL LLM / HYBRID RAG");

  const tools = page.getByRole("region", { name: "Software you can use", exact: true });
  await expect(tools.locator(".kick")).toContainText("Live software");
  await expect(tools.getByRole("link", { name: "VIEW ALL SOFTWARE →", exact: true })).toHaveAttribute("href", "/lab");
  await expect(tools.locator('[data-layout="work"]')).toHaveCount(4);
});

test("published work uses a compact two-tier desktop hierarchy", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "Desktop grid geometry is covered by the desktop project");
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/");
  await waitForFonts(page);

  const grid = page.locator('[data-home-section="selected-work"] .flagship-grid');
  const featured = grid.locator('[data-tier="featured"]');
  const supporting = grid.locator('[data-tier="supporting"]');
  const gridBox = await grid.boundingBox();
  const first = await featured.nth(0).boundingBox();
  const second = await featured.nth(1).boundingBox();
  const archive = await supporting.nth(0).boundingBox();
  const piggy = await supporting.nth(1).boundingBox();
  const memory = await supporting.nth(2).boundingBox();
  const northPeak = await supporting.nth(3).boundingBox();
  expect(gridBox).not.toBeNull();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(archive).not.toBeNull();
  expect(piggy).not.toBeNull();
  expect(memory).not.toBeNull();
  expect(northPeak).not.toBeNull();

  expect(Math.abs(first!.y - second!.y)).toBeLessThan(1);
  expect(first!.width).toBeGreaterThanOrEqual(500);
  expect(first!.width).toBeLessThanOrEqual(580);
  /* text metrics differ slightly per platform, so the summary can wrap one line
     taller on Linux/Android than on Windows; the bound leaves room for that */
  expect(first!.height).toBeLessThanOrEqual(640);
  /* cards in one row share a height (grid stretch) and their primary actions
     sit on one baseline (actions pinned to the card bottom) */
  expect(Math.abs(first!.height - second!.height)).toBeLessThan(1);
  expect(archive!.width).toBeGreaterThanOrEqual(320);
  expect(archive!.width).toBeLessThanOrEqual(380);
  expect(archive!.height).toBeLessThanOrEqual(560);
  expect(piggy!.width).toBe(archive!.width);
  expect(Math.abs(piggy!.height - archive!.height)).toBeLessThan(1);
  expect(memory!.width).toBe(archive!.width);
  expect(Math.abs(memory!.height - archive!.height)).toBeLessThan(1);
  expect(northPeak!.width).toBe(archive!.width);
  const supportingActionTops = await supporting
    .locator('[data-card-action="primary"]')
    .evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().top)));
  expect(new Set(supportingActionTops.slice(0, 3)).size).toBe(1);
  expect(Math.abs(archive!.y - piggy!.y)).toBeLessThan(1);
  expect(Math.abs(archive!.y - memory!.y)).toBeLessThan(1);
  expect(archive!.y).toBeGreaterThan(first!.y + Math.max(first!.height, second!.height));
  expect(Math.abs(archive!.x - gridBox!.x)).toBeLessThan(1);
  expect(northPeak!.y).toBeGreaterThan(archive!.y + archive!.height);
  expect(Math.abs(northPeak!.x + northPeak!.width / 2 - (gridBox!.x + gridBox!.width / 2))).toBeLessThan(1);
  await expect(supporting.nth(3)).toHaveAttribute("data-supporting-tail", "1");

  const presentation = await grid.evaluate((node) => ({
    columns: getComputedStyle(node).gridTemplateColumns.split(" ").length,
    summaryClamp: getComputedStyle(node.querySelector(".flagship-summary")!).webkitLineClamp,
  }));
  expect(presentation).toEqual({ columns: 6, summaryClamp: "3" });
  await expect(featured.locator('[data-card-action="primary"]').first()).toHaveCSS("height", "44px");
});

test("supporting rows remain balanced as future cards are added", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "Desktop grid geometry is covered by the desktop project");
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/");

  const grid = page.locator('[data-home-section="selected-work"] .flagship-grid');
  const supporting = grid.locator('[data-tier="supporting"]');
  const setSupportingCount = async (count: number): Promise<void> => {
    await grid.evaluate((node, nextCount) => {
      const cards = [...node.querySelectorAll<HTMLElement>('[data-tier="supporting"]')];
      const template = cards[0];
      while (cards.length < nextCount) {
        const clone = template.cloneNode(true) as HTMLElement;
        clone.removeAttribute("id");
        clone.dataset.flagshipCard = `future-supporting-${cards.length + 1}`;
        node.append(clone);
        cards.push(clone);
      }
      while (cards.length > nextCount) cards.pop()?.remove();

      const tailSize = nextCount % 3;
      cards.forEach((card, index) => {
        card.removeAttribute("data-supporting-tail");
        card.removeAttribute("data-supporting-tail-position");
        if (tailSize > 0 && index >= nextCount - tailSize) {
          card.dataset.supportingTail = String(tailSize);
          card.dataset.supportingTailPosition = String(index - (nextCount - tailSize) + 1);
        }
      });
    }, count);
  };
  const boxes = async () =>
    supporting.evaluateAll((cards) =>
      cards.map((card) => {
        const { x, y, width, height } = card.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
  const gridBox = await grid.boundingBox();
  expect(gridBox).not.toBeNull();

  await setSupportingCount(1);
  const one = await boxes();
  expect(Math.abs(one[0].x + one[0].width / 2 - (gridBox!.x + gridBox!.width / 2))).toBeLessThan(1);

  await setSupportingCount(3);
  const three = await boxes();
  expect(new Set(three.map(({ y }) => y)).size).toBe(1);
  expect(Math.abs(three[0].x - gridBox!.x)).toBeLessThan(1);
  expect(Math.abs(three[2].x + three[2].width - (gridBox!.x + gridBox!.width))).toBeLessThan(1);

  await setSupportingCount(5);
  const five = await boxes();
  expect(Math.abs(five[3].y - five[4].y)).toBeLessThan(1);
  expect(five[3].y).toBeGreaterThan(five[0].y + five[0].height);
  expect(Math.abs((five[3].x + five[4].x + five[4].width) / 2 - (gridBox!.x + gridBox!.width / 2))).toBeLessThan(1);
});

test("work index exposes real anchors without publishing gated projects", async ({ page }) => {
  await page.goto("/work#english-voice-coach");

  await expect(page.locator("#english-voice-coach")).toBeVisible();
  const published = page.getByRole("region", { name: "Published project overviews", exact: true });
  await expect(published.locator("[data-flagship-card]")).toHaveCount(6);
  await expect(published.getByRole("heading", { name: "English Voice Coach", exact: true })).toBeVisible();
  await expect(published.getByRole("heading", { name: "Llamail", exact: true })).toBeVisible();
  await expect(published.getByRole("heading", { name: "EazeGames", exact: true })).toBeVisible();
  await expect(published.getByRole("heading", { name: "Piggy.eu", exact: true })).toBeVisible();
  await expect(published.getByRole("heading", { name: "Zharwing Memory", exact: true })).toBeVisible();

  await expect(page.getByRole("region", { name: "Not published as product work yet.", exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Real-Time Collaborative SaaS Architecture", exact: true }),
  ).toHaveCount(0);
});

test("flagship cards reflow after a compact interactive mobile atlas", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");

  const atlas = page.locator(".hero-grid [data-atlas-frame]");
  await expect(atlas).toBeVisible();
  await expect(atlas.locator("[data-atlas-svg]")).toBeVisible();
  await expect(atlas.locator(".readout")).toBeHidden();
  const atlasBox = await atlas.boundingBox();
  const warsawBox = await atlas.locator('[data-code="WAW"]').boundingBox();
  expect(atlasBox).not.toBeNull();
  expect(atlasBox!.height).toBeLessThanOrEqual(240);
  expect(warsawBox).not.toBeNull();

  const cards = page.locator('[data-home-section="selected-work"] [data-flagship-card]');
  expect(
    await cards
      .locator(".flagship-summary")
      .evaluateAll((items) => items.every((item) => item.scrollHeight <= item.clientHeight)),
  ).toBe(true);
  const boxes = await cards.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON()));
  expect(boxes).toHaveLength(6);
  expect(boxes[0].height).toBeLessThanOrEqual(560);
  expect(boxes[1].height).toBeLessThanOrEqual(560);
  for (const box of boxes.slice(2)) expect(box.height).toBeLessThanOrEqual(510);
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index].y).toBeGreaterThanOrEqual(boxes[index - 1].y + boxes[index - 1].height);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
