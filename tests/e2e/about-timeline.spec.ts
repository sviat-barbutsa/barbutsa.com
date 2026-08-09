import { expect, test } from "@playwright/test";

const expectedDates = [
  "Apr 2020 - Present",
  "Nov 2019 - Apr 2020",
  "Feb 2018 - Oct 2019",
  "Oct 2017 - Jan 2018",
  "Dec 2016 - Oct 2017",
  "Mar 2016 - Nov 2016",
  "Jan 2015 - Feb 2016",
  "Jun 2013 - Dec 2014",
];

test("About publishes the complete evidence-backed employer chronology", async ({ page }) => {
  await page.goto("/about");

  const timeline = page.locator('[aria-labelledby="h-timeline"]');
  const entries = timeline.locator('[data-layout="timeline"]');
  await expect(entries).toHaveCount(8);
  await expect(entries.locator(".career-dates")).toHaveText(expectedDates);
  await expect(timeline.getByText("Current", { exact: true })).toHaveCount(1);
  await expect(timeline.locator("time")).toHaveCount(15);

  const eazegames = timeline.locator('[data-career-id="sharpminds-eazegames-2016-2017"]');
  await expect(eazegames.locator(".career-employer")).toHaveText("SharpMinds");
  await expect(eazegames.locator(".career-client")).toHaveText("client: EazeGames");
  await expect(eazegames).not.toContainText("0.8 seconds");
  await expect(eazegames.getByRole("link", { name: "View historical case study" })).toHaveAttribute(
    "href",
    "/work/eazegames-original-web-platform",
  );

  const piggy = timeline.locator('[data-career-id="sharpminds-piggy-2018-2019"]');
  await expect(piggy.locator(".career-employer")).toHaveText("SharpMinds");
  await expect(piggy.locator(".career-client")).toHaveText("client: Piggy.eu");

  const smileDirectClub = timeline.locator('[data-career-id="uvik-smiledirectclub-2019-2020"]');
  await expect(smileDirectClub.locator(".career-employer")).toHaveText("Uvik Software");
  await expect(smileDirectClub.locator(".career-client")).toHaveText("client: SmileDirectClub");

  const softServe = timeline.locator('.index-row:has(.career-employer:text-is("SoftServe"))');
  await expect(softServe).toHaveCount(2);
  await expect(timeline.getByText(/approximately 2 seconds to 0\.8 seconds/)).toHaveCount(1);
  await expect(page.getByText(/USCIS|immigration petition|signed career timeline/i)).toHaveCount(0);
});

test("exact career dates remain readable across the supported viewport set", async ({ page }) => {
  await page.goto("/about");

  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const firstEntry = page.locator('[data-career-id="fearless-little-2020-present"]');
    await expect(firstEntry.locator(".career-dates")).toBeVisible();
    await expect(firstEntry.locator(".career-entry")).toBeVisible();

    if (width <= 390) {
      const stacked = await firstEntry.evaluate((element) => {
        const dates = element.querySelector(".career-dates")?.getBoundingClientRect();
        const detail = element.querySelector(".career-entry")?.getBoundingClientRect();
        return Boolean(dates && detail && dates.bottom <= detail.top);
      });
      expect(stacked).toBe(true);
    }
  }

  const caseStudyLink = page.getByRole("link", { name: "View historical case study" });
  await caseStudyLink.focus();
  await expect(caseStudyLink).toBeFocused();
});
