export const eazeDescription =
  "Case study of the original EazeGames frontend: React, Redux, WebSockets, payments, role-based access, internationalization, and a shared UI library.";

export const eazeFacts = [
  ["Role", "Senior Frontend Developer"],
  ["Employer", "SharpMinds"],
  ["Client", "EazeGames"],
  ["Engagement", "2016–2017"],
  ["Scope", "Original web frontend"],
  ["Starting team", "Two people"],
  ["Expanded team", "Six frontend contributors after the prototype phase"],
  ["Delivery", "Original frontend launched during the engagement"],
] as const;

export const eazeProofs = [
  "Frontend created from scratch",
  "Real-time WebSocket product flows",
  "Shared component and utility library",
  "Production delivery from a two-person frontend starting team",
  "Frontend CI, candidate interviews, and junior mentoring",
] as const;

export const eazeOwnership = [
  "Frontend architecture and application structure",
  "Core React and Redux implementation",
  "Shared UI component and utility library",
  "WebSocket updates for competitions, rankings, and account state",
  "HTML5 game integration inside the product shell",
  "Payment, role-based, webshop, onboarding, and localized UI flows",
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
  "WebSocket updates changed player activity, rankings, balances, and competition progress.",
  "Money and practice currency, user roles, and account status each changed what the interface displayed and allowed.",
  "Integrated HTML5 games and interrupted connections needed clear loading, error, and recovery states inside the same product flow.",
] as const;

export const eazeModernApproach = [
  "Typed contracts for WebSocket and API events",
  "State machines for competition, wallet, and verification flows",
  "Integration tests and monitoring around WebSocket and Pay.nl failures",
] as const;

export const eazeMediaBase = "/work/eazegames/";

export const eazeMedia = {
  home: {
    name: "eazegames-v1-home",
    width: 1820,
    height: 1112,
    alt: "Sanitized archival EazeGames Version 1 authenticated competition and game-discovery hub",
    caption: "Version 1 competition and game-discovery hub. Account details have been replaced with test data.",
  },
  landing: {
    name: "eazegames-v1-landing",
    width: 1821,
    height: 1110,
    alt: "Archival EazeGames Version 1 public landing experience",
    caption: "Version 1 landing page for the mobile apps and HTML5 game catalog.",
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
    caption: "The authenticated navigation covered competitions, games, payments, verification, profile, and settings.",
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
      "Live competition activity updated player results and rankings. Player identities have been replaced with test data.",
  },
  notifications: {
    name: "eazegames-v1-notifications",
    width: 553,
    height: 567,
    alt: "Sanitized archival EazeGames contextual notification center",
    caption: "Notifications covered game reminders, account actions, app downloads, and product guidance.",
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
    description: "Historical case study of the original 2016–2017 frontend engagement.",
  },
} as const;
