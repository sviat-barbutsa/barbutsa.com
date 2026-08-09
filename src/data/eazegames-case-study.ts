export const eazeDescription =
  "Historical case study of the original EazeGames web frontend: a real-time React platform with competitions, payments UI, roles, internationalization, and shared UI foundations.";

export const eazeFacts = [
  ["Role", "Senior Frontend Developer"],
  ["Employer", "SharpMinds"],
  ["Client", "EazeGames"],
  ["Engagement", "2016-2017"],
  ["Scope", "Original web frontend"],
  ["Starting team", "Two people"],
  ["Expanded team", "Six people after prototype success"],
  ["Delivery", "Production launch in approximately 1.5 years"],
  ["Current state", "Independently evolved product remains active"],
] as const;

export const eazeProofs = [
  "Frontend created from the ground up",
  "Real-time WebSocket product flows",
  "Reusable component and utility foundation",
  "Production delivery from a two-person starting team",
  "Frontend CI, candidate interviews, and junior mentoring",
  "Product continuity years after the original launch",
] as const;

export const eazeOwnership = [
  "Frontend architecture and application structure",
  "Core React and Redux implementation",
  "Shared UI component and utility library",
  "WebSocket-driven product states",
  "HTML5 game integration inside the product shell",
  "Frontend payment, role, webshop, onboarding, and localization surfaces",
  "Frontend CI and delivery workflow",
  "Client meetings, estimation, code review, candidate interviews, and junior mentoring",
] as const;

export const eazeJourney = [
  "Public landing",
  "Sign up or log in",
  "Account validation and age consent",
  "Practice currency or money-play onboarding",
  "Competition and game discovery",
  "Enter a competition or join by code",
  "Play an integrated HTML5 game",
  "Live result, rank, and winnings state",
  "Wallet, verification, profile, settings, and notifications",
] as const;

export const eazeArchitecture = [
  {
    title: "Shared UI foundation",
    items: ["Reusable components", "Utilities and interaction conventions"],
    boundary: false,
  },
  {
    title: "Authentication and RBAC surfaces",
    items: ["Profile", "Verification", "Settings"],
    boundary: false,
  },
  {
    title: "Competition and catalog state",
    items: ["Entry by code", "Tournament and ranking views", "HTML5 game boundary"],
    boundary: true,
  },
  {
    title: "WebSocket event boundary",
    items: ["Player activity", "Results and rankings", "Account and competition updates"],
    boundary: true,
  },
  {
    title: "Payments and wallet UI",
    items: ["Money and practice states", "Pay.nl service boundary"],
    boundary: true,
  },
  {
    title: "Delivery foundation",
    items: ["Internationalization", "Frontend CI", "Production delivery"],
    boundary: false,
  },
] as const;

export const eazeRealTimeComplexity = [
  "Multiple user and competition states had to remain understandable as live events arrived.",
  "WebSocket updates affected activity, rankings, balances, and competition progress.",
  "Money and practice currency required visibly distinct product states.",
  "Authenticated navigation exposed role- and account-dependent surfaces.",
  "Game integrations had to coexist inside one consistent product shell.",
  "Errors and connection changes needed recoverable interface states.",
] as const;

export const eazeModernApproach = [
  "TypeScript-first contracts",
  "Explicit state machines for money and competition workflows",
  "Modern design tokens and documented component APIs",
  "Contract and integration tests around real-time events",
  "Observability for WebSocket and payment-boundary failures",
  "Progressive delivery and visual-regression testing",
] as const;

export const eazeMediaBase = "/work/eazegames/";

export const eazeMedia = {
  home: {
    name: "eazegames-v1-home",
    width: 1820,
    height: 1112,
    alt: "Sanitized archival EazeGames Version 1 authenticated competition and game-discovery hub",
    caption:
      "Original Version 1 competition and game-discovery hub. Archival interface from the frontend I worked on during 2016-2017; account identity has been sanitized.",
  },
  landing: {
    name: "eazegames-v1-landing",
    width: 1821,
    height: 1110,
    alt: "Archival EazeGames Version 1 public landing experience",
    caption:
      "Original public landing experience connecting the web product with its mobile ecosystem and skill-game catalog.",
  },
  onboarding: {
    name: "eazegames-v1-onboarding",
    width: 1825,
    height: 1105,
    alt: "Sanitized archival EazeGames onboarding explaining practice currency and money play",
    caption:
      "Onboarding explained the distinction between practice currency and money play before users entered the competition experience.",
  },
  navigation: {
    name: "eazegames-v1-navigation",
    width: 1839,
    height: 1120,
    alt: "Sanitized archival EazeGames authenticated navigation drawer",
    caption:
      "The authenticated navigation joined competitions, games, payments, verification, profile, and settings inside one product shell.",
  },
  rankings: {
    name: "eazegames-v1-rankings",
    width: 1803,
    height: 1093,
    alt: "Sanitized archival EazeGames competition and ranking interface with synthetic player identities",
    caption:
      "Competition discovery and searchable ranking interface. Player identities and account information are anonymized.",
  },
  live: {
    name: "eazegames-v1-live-activity",
    width: 1796,
    height: 1103,
    alt: "Sanitized archival EazeGames live competition activity table with synthetic player identities",
    caption:
      "Live competition activity presented as a structured, continuously changing data surface. Player identities are anonymized.",
  },
  notifications: {
    name: "eazegames-v1-notifications",
    width: 553,
    height: 567,
    alt: "Sanitized archival EazeGames contextual notification center",
    caption: "Contextual notifications connected game reminders, account actions, app downloads, and product guidance.",
  },
} as const;

export const eazeStructuredData = {
  "@type": "CreativeWork",
  "@id": "https://barbutsa.com/work/eazegames-original-web-platform#case-study",
  name: "EazeGames Original Web Platform",
  description: eazeDescription,
  url: "https://barbutsa.com/work/eazegames-original-web-platform",
  dateCreated: "2026-08-08",
  author: { "@id": "https://barbutsa.com/#person" },
  about: {
    "@type": "Thing",
    name: "EazeGames original web frontend (Version 1)",
    description: "Historical case study of the original 2016-2017 frontend engagement.",
  },
} as const;
