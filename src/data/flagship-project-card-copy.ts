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
  voiceCoach: {
    tier: "featured",
    meta: "INDEPENDENT PRODUCT · ANDROID · 2026",
    status: "PRIVATE RELEASE CANDIDATE",
    summary:
      "A private speaking coach that turns speech into corrections, explanations, and repeat practice on-device.",
    ownership: "Designed and built end-to-end",
    technologies: ["Flutter", "whisper.cpp", "On-device AI"],
  },
  llamail: {
    tier: "featured",
    meta: "INDEPENDENT SYSTEM · LOCAL-FIRST AI",
    summary: "A private email agent with deterministic routing, hybrid retrieval, cited answers, and reviewed actions.",
    ownership: "Built end-to-end: architecture, retrieval, agents, and operator workflow",
    technologies: ["Python", "FastAPI", "llama.cpp"],
  },
  zharwingMemory: {
    tier: "supporting",
    meta: "OPEN SOURCE · LOCAL-FIRST · DEVELOPER PREVIEW",
    summary: "Durable, project-scoped context across AI coding tools.",
    ownership: "Designed and built end-to-end",
    technologies: ["TypeScript", "Tauri", "MCP"],
  },
} as const satisfies Record<string, FlagshipProjectCard>;
