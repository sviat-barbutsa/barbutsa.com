export interface FlagshipProjectCard {
  tier: "featured" | "supporting";
  order: number;
  meta: string;
  status?: string;
  summary: string;
  ownership: string;
  technologies: readonly [string, string, string];
}

export const flagshipProjectCardCopy = {
  collaborativeSaas: {
    tier: "featured",
    order: 10,
    meta: "RECENT COMMERCIAL WORK · 2020–2026",
    status: "NDA-PROTECTED",
    summary: "Frontend architecture and hands-on delivery across a multi-application React and Next.js SaaS platform.",
    ownership: "Frontend architecture, major implementation, and team mentorship",
    technologies: ["React / Next.js", "TypeScript", "Real-time SaaS"],
  },
  eazegames: {
    tier: "supporting",
    order: 30,
    meta: "ARCHIVE · WEB PLATFORM · 2016–17",
    summary: "Original real-time competition platform.",
    ownership: "Original frontend architecture",
    technologies: ["React", "Redux", "WebSockets"],
  },
  piggy: {
    tier: "featured",
    order: 20,
    meta: "ARCHIVE · LOYALTY PLATFORM · 2018–19",
    status: "PIGGY.EU TODAY",
    summary: "Original loyalty and discount web frontend.",
    ownership: "Frontend architecture, shared UI, and technical leadership",
    technologies: ["React", "TypeScript", "MobX"],
  },
  voiceCoach: {
    tier: "supporting",
    order: 60,
    meta: "INDEPENDENT PRODUCT · ANDROID · 2026",
    status: "PRIVATE RELEASE CANDIDATE",
    summary: "On-device speech correction, explanations, and repeat practice.",
    ownership: "Designed and implemented end-to-end",
    technologies: ["Flutter", "whisper.cpp", "On-device AI"],
  },
  llamail: {
    tier: "supporting",
    order: 50,
    meta: "INDEPENDENT SYSTEM · LOCAL-FIRST AI",
    summary: "Local email agent with cited retrieval and reviewed actions.",
    ownership: "Implemented architecture, retrieval, agents, and operator workflow",
    technologies: ["Python", "FastAPI", "llama.cpp"],
  },
  zharwingMemory: {
    tier: "supporting",
    order: 40,
    meta: "OPEN SOURCE · LOCAL-FIRST · DEVELOPER PREVIEW",
    summary: "Sessions, decisions, diagrams, and handoffs for AI coding tools.",
    ownership: "Implemented the Tauri app, TypeScript core, and MCP server",
    technologies: ["TypeScript", "Tauri", "MCP"],
  },
} as const satisfies Record<string, FlagshipProjectCard>;
