import { describe, expect, it } from "vitest";
import {
  careerTimeline,
  formatCareerRange,
  monthKey,
  validateCareerTimeline,
  type CareerEntry,
} from "@/data/career-timeline";

describe("career timeline", () => {
  it("publishes the approved eight-record chronology", () => {
    expect(careerTimeline).toHaveLength(8);
    expect(careerTimeline[0]).toMatchObject({
      id: "fearless-little-2020-2026",
      employer: "Fearless Little",
      displayDates: "Apr 2020 - Aug 2026",
      end: { year: 2026, month: 8 },
    });
    expect(careerTimeline.at(-1)).toMatchObject({
      id: "trilobite-web-studio-2013-2014",
      employer: "Trilobite Web Studio",
      displayDates: "Jun 2013 - Dec 2014",
    });
  });

  it("keeps employers, clients, titles, and outcomes correctly attributed", () => {
    const eazegames = careerTimeline.find((entry) => entry.client === "EazeGames");
    const piggy = careerTimeline.find((entry) => entry.client === "Piggy.eu");
    const smileDirectClub = careerTimeline.find((entry) => entry.client === "SmileDirectClub");
    const softServe = careerTimeline.filter((entry) => entry.employer === "SoftServe");

    expect(eazegames).toMatchObject({
      employer: "SharpMinds",
      formalTitle: "Senior Front-End Web Developer",
      displayDates: "Dec 2016 - Oct 2017",
      projectSlug: "/work/eazegames-original-web-platform",
    });
    expect(eazegames?.summary).not.toContain("0.8 seconds");
    expect(piggy).toMatchObject({
      employer: "SharpMinds",
      displayDates: "Feb 2018 - Oct 2019",
      projectSlug: "/work/piggy-original-loyalty-frontend",
    });
    expect(smileDirectClub).toMatchObject({ employer: "Uvik Software", displayDates: "Nov 2019 - Apr 2020" });
    expect(softServe).toHaveLength(2);
    expect(softServe.filter((entry) => entry.summary.includes("0.8 seconds"))).toHaveLength(1);
    expect(softServe.find((entry) => entry.summary.includes("0.8 seconds"))?.displayDates).toBe("Oct 2017 - Jan 2018");
  });

  it("keeps a fully closed employment chronology in valid reverse order", () => {
    expect(careerTimeline.filter((entry) => entry.current)).toHaveLength(0);
    expect(careerTimeline.every((entry) => entry.end !== null)).toBe(true);

    for (let index = 1; index < careerTimeline.length; index += 1) {
      expect(monthKey(careerTimeline[index - 1].start)).toBeGreaterThan(monthKey(careerTimeline[index].start));
      expect(formatCareerRange(careerTimeline[index])).toBe(careerTimeline[index].displayDates);
    }
  });

  it("rejects invalid ranges, chronology, and current-state mismatches", () => {
    const current: CareerEntry = {
      ...careerTimeline[0],
      id: "synthetic-current",
      end: null,
      displayDates: "Apr 2020 - Present",
      current: true,
    };
    const invalidRange: CareerEntry = {
      ...careerTimeline[1],
      id: "invalid-range",
      start: { year: 2020, month: 5 },
      end: { year: 2020, month: 4 },
      displayDates: "May 2020 - Apr 2020",
    };

    expect(() => validateCareerTimeline([current, invalidRange])).toThrow("Invalid career range");
    expect(() => validateCareerTimeline([{ ...current, end: { year: 2026, month: 8 } }])).toThrow(
      "Current/end mismatch",
    );
    expect(() =>
      validateCareerTimeline([
        current,
        {
          ...current,
          id: "second-current",
          start: { year: 2019, month: 1 },
          displayDates: "Jan 2019 - Present",
        },
      ]),
    ).toThrow("at most one current");
    expect(() => validateCareerTimeline([careerTimeline[1], current])).toThrow("not newest first");
  });
});
