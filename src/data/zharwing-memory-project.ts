import { flagshipProjectCardCopy } from "./flagship-project-card-copy";
import type { PublishedFlagshipProject } from "./flagship-projects";

export const zharwingMemoryProject = {
  slug: "zharwing-memory",
  title: "Zharwing Memory",
  eyebrow: "OPEN SOURCE · LOCAL-FIRST DEVELOPER TOOL",
  status: "developer-preview",
  statusLabel: "LOCAL SOFTWARE · DEVELOPER PREVIEW",
  summary:
    "A project-scoped memory layer for AI-assisted coding workflows, with sessions, decisions, diagrams, search, graph relationships, and deliberate context handoffs.",
  ownership: "Independent product · Designed and built end-to-end",
  technologies: ["TypeScript", "Tauri", "React", "MCP", "Markdown"],
  availability:
    "Open-source developer preview that runs locally from source. The public website documents the product; it is not a hosted memory service.",
  publicationState: "published",
  publicationGate: null,
  card: flagshipProjectCardCopy.zharwingMemory,
  media: {
    kind: "product",
    label: "Zharwing Memory project dashboard using the fictional EchoDesk demonstration project",
    caption: "Public product interface using fictional demonstration data.",
    images: [
      {
        src: "/work/zharwing-memory/zharwing-memory-dashboard.png",
        alt: "Zharwing Memory dashboard showing current work, context preview, memory updates, and graph statistics for the fictional EchoDesk project",
        width: 1280,
        height: 720,
      },
    ],
  },
  primaryAction: {
    label: "View project ↗",
    href: "https://zharwing.barbutsa.com/memory/",
    external: true,
  },
} satisfies PublishedFlagshipProject;
