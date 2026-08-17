export interface FlagshipProjectCard {
  tier: "featured" | "supporting";
  meta: string;
  status?: string;
  summary: string;
  ownership: string;
  technologies: readonly [string, string, string];
}

export const flagshipProjectCardCopy = {
  eazegames: {
    tier: "supporting",
    meta: "ARCHIVE · WEB PLATFORM · 2016–17",
    summary: "Original real-time competition platform.",
    ownership: "Original frontend architecture",
    technologies: ["React", "Redux", "WebSockets"],
  },
  piggy: {
    tier: "supporting",
    meta: "ARCHIVE · LOYALTY PLATFORM · 2018–19",
    status: "PIGGY.EU TODAY",
    summary: "Original loyalty and discount web frontend.",
    ownership: "Frontend architecture, shared UI, and technical leadership",
    technologies: ["React", "TypeScript", "MobX"],
  },
  voiceCoach: {
    tier: "featured",
    meta: "INDEPENDENT PRODUCT · ANDROID · 2026",
    status: "PRIVATE RELEASE CANDIDATE",
    summary:
      "A private speaking coach that turns speech into corrections, explanations, and repeat practice on-device.",
    ownership: "Designed and implemented end-to-end",
    technologies: ["Flutter", "whisper.cpp", "On-device AI"],
  },
  llamail: {
    tier: "featured",
    meta: "INDEPENDENT SYSTEM · LOCAL-FIRST AI",
    summary: "A private email agent with hybrid retrieval, cited answers, and human-reviewed actions.",
    ownership: "Implemented architecture, retrieval, agents, and operator workflow",
    technologies: ["Python", "FastAPI", "llama.cpp"],
  },
  zharwingMemory: {
    tier: "supporting",
    meta: "OPEN SOURCE · LOCAL-FIRST · DEVELOPER PREVIEW",
    summary: "Sessions, decisions, diagrams, and handoffs for AI coding tools.",
    ownership: "Implemented the Tauri app, TypeScript core, and MCP server",
    technologies: ["TypeScript", "Tauri", "MCP"],
  },
} as const satisfies Record<string, FlagshipProjectCard>;
