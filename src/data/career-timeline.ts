export interface CareerDate {
  readonly year: number;
  readonly month: number;
}

export interface CareerEntry {
  readonly id: string;
  readonly start: CareerDate;
  readonly end: CareerDate | null;
  readonly displayDates: string;
  readonly formalTitle: string;
  readonly publicTitle?: string;
  readonly employer: string;
  readonly client?: string;
  readonly location?: string;
  readonly summary: string;
  readonly current?: boolean;
  readonly projectSlug?: string;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthKey(date: CareerDate): number {
  return date.year * 12 + date.month;
}

export function formatCareerMonth(date: CareerDate): string {
  return `${monthNames[date.month - 1]} ${date.year}`;
}

export function toCareerDateTime(date: CareerDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}`;
}

export function formatCareerRange(entry: Pick<CareerEntry, "start" | "end">): string {
  return `${formatCareerMonth(entry.start)} - ${entry.end ? formatCareerMonth(entry.end) : "Present"}`;
}

function assertCareerDate(date: CareerDate, id: string, boundary: string): void {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || date.month < 1 || date.month > 12) {
    throw new Error(`Invalid ${boundary} date: ${id}`);
  }
}

export function validateCareerTimeline(entries: readonly CareerEntry[]): readonly CareerEntry[] {
  const ids = new Set<string>();
  let previousStart = Number.POSITIVE_INFINITY;
  let currentEntries = 0;

  for (const entry of entries) {
    if (!entry.id || ids.has(entry.id)) throw new Error(`Duplicate or missing career id: ${entry.id}`);
    ids.add(entry.id);

    if (!entry.employer.trim()) throw new Error(`Missing employer: ${entry.id}`);
    if (entry.client !== undefined && !entry.client.trim()) throw new Error(`Empty client: ${entry.id}`);

    assertCareerDate(entry.start, entry.id, "start");
    if (entry.end) assertCareerDate(entry.end, entry.id, "end");
    if (entry.end && monthKey(entry.end) < monthKey(entry.start)) {
      throw new Error(`Invalid career range: ${entry.id}`);
    }

    const isCurrent = entry.current === true;
    if (isCurrent) currentEntries += 1;
    if (isCurrent !== (entry.end === null)) throw new Error(`Current/end mismatch: ${entry.id}`);
    if (entry.displayDates !== formatCareerRange(entry)) throw new Error(`Display date mismatch: ${entry.id}`);

    const start = monthKey(entry.start);
    if (start > previousStart) throw new Error(`Career timeline is not newest first: ${entry.id}`);
    previousStart = start;
  }

  if (currentEntries !== 1) throw new Error(`Expected one current career entry, received ${currentEntries}`);
  return entries;
}

export const careerTimeline = validateCareerTimeline([
  {
    id: "fearless-little-2020-present",
    start: { year: 2020, month: 4 },
    end: null,
    displayDates: "Apr 2020 - Present",
    formalTitle: "Lead Front-End Developer",
    publicTitle: "Lead Front-End Developer → Lead Software Engineer responsibilities",
    employer: "Fearless Little",
    location: "USA",
    current: true,
    summary:
      "Initially led frontend development of a cross-platform product spanning web, mobile, and desktop from one React, Next.js, and React Native codebase. Subsequently expanded into Lead Software Engineer responsibilities for an AI-powered collaborative SaaS, including frontend and Cloudflare platform architecture, real-time systems, applied AI features, and team leadership.",
  },
  {
    id: "uvik-smiledirectclub-2019-2020",
    start: { year: 2019, month: 11 },
    end: { year: 2020, month: 4 },
    displayDates: "Nov 2019 - Apr 2020",
    formalTitle: "Python / Full-Stack Developer",
    employer: "Uvik Software",
    client: "SmileDirectClub",
    location: "Ukraine",
    summary:
      "Expanded into full-stack delivery with Python and Django, React, and Vue, implementing SEPA payment modules and supporting frontend, API, testing, and performance work across enterprise platforms.",
  },
  {
    id: "sharpminds-piggy-2018-2019",
    start: { year: 2018, month: 2 },
    end: { year: 2019, month: 10 },
    displayDates: "Feb 2018 - Oct 2019",
    formalTitle: "Senior Front-End Web Developer",
    employer: "SharpMinds",
    client: "Piggy.eu",
    location: "Chernivtsi, Ukraine",
    summary:
      "Defined and led the frontend architecture from scratch for the Piggy.eu loyalty and discount platform. Started as the sole frontend engineer, created the shared React and TypeScript UI foundation and Jenkins CI workflow, and supported the team as it expanded after the MVP launch.",
  },
  {
    id: "softserve-2017-2018",
    start: { year: 2017, month: 10 },
    end: { year: 2018, month: 1 },
    displayDates: "Oct 2017 - Jan 2018",
    formalTitle: "Senior Front-End Web Developer",
    employer: "SoftServe",
    location: "Chernivtsi, Ukraine",
    summary:
      "Joined a data-heavy enterprise platform near delivery, contributing React and TypeScript frontend development, refactoring, performance optimization, code review, estimation, and junior-developer support. Reduced the most complex page load from approximately 2 seconds to 0.8 seconds through resource-loading analysis, React render optimization, and Redux data-flow improvements.",
  },
  {
    id: "sharpminds-eazegames-2016-2017",
    start: { year: 2016, month: 12 },
    end: { year: 2017, month: 10 },
    displayDates: "Dec 2016 - Oct 2017",
    formalTitle: "Senior Front-End Web Developer",
    employer: "SharpMinds",
    client: "EazeGames",
    location: "Chernivtsi, Ukraine",
    projectSlug: "/work/eazegames-original-web-platform",
    summary:
      "Designed the frontend architecture and implemented the original real-time HTML5 skill-gaming web application from scratch, including WebSocket product flows, competitions, payment UI, roles, webshop, internationalization, reusable UI foundations, and frontend CI.",
  },
  {
    id: "softserve-2016",
    start: { year: 2016, month: 3 },
    end: { year: 2016, month: 11 },
    displayDates: "Mar 2016 - Nov 2016",
    formalTitle: "Front-End Web Developer",
    employer: "SoftServe",
    location: "Chernivtsi, Ukraine",
    summary:
      "Developed an internationalized healthcare platform using Angular 2 during its early release cycle, contributing application architecture, framework migrations, module updates, refactoring, optimization, code review, customer communication, and team support.",
  },
  {
    id: "softimus-2015-2016",
    start: { year: 2015, month: 1 },
    end: { year: 2016, month: 2 },
    displayDates: "Jan 2015 - Feb 2016",
    formalTitle: "Software and Front-End Developer",
    employer: "Softimus",
    location: "Chernivtsi, Ukraine",
    summary:
      "Moved into specialized frontend engineering on a corporate medical-equipment platform, developing and modernizing client-side applications, email interfaces, and SEO and UI foundations with TypeScript, Gulp, and Stylus.",
  },
  {
    id: "trilobite-web-studio-2013-2014",
    start: { year: 2013, month: 6 },
    end: { year: 2014, month: 12 },
    displayDates: "Jun 2013 - Dec 2014",
    formalTitle: "Software and Web Developer",
    employer: "Trilobite Web Studio",
    location: "Chernivtsi, Ukraine",
    summary:
      "Created websites with a partner for private clients using JavaScript, HTML, CSS, and CMS platforms including WordPress, Joomla, OpenCart, MODX, and UMI.CMS.",
  },
] satisfies readonly CareerEntry[]);
