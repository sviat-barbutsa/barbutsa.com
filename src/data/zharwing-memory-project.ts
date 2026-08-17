import { flagshipProjectCardCopy } from "./flagship-project-card-copy";
import type { PublishedFlagshipProject } from "./flagship-projects";

export const zharwingMemoryProject = {
  slug: "zharwing-memory",
  title: "Zharwing Memory",
  eyebrow: "OPEN SOURCE · LOCAL-FIRST DEVELOPER TOOL",
  status: "developer-preview",
  statusLabel: "LOCAL SOFTWARE · DEVELOPER PREVIEW",
  summary:
    "A local project memory system that stores coding sessions, decisions, diagrams, and handoff notes. The desktop app shows their relationships, while MCP exposes session context and search to coding tools.",
  ownership: "Independent product · Tauri desktop app, TypeScript core, React UI, and MCP server",
  technologies: ["TypeScript", "Tauri", "React", "MCP", "Markdown"],
  availability:
    "Open-source developer preview that runs locally from source. The public website contains documentation and screenshots.",
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
