import { flagshipProjectCardCopy, type FlagshipProjectCard } from "./flagship-project-card-copy";
import { northPeakProject } from "./north-peak-project";
import { zharwingMemoryProject } from "./zharwing-memory-project";

export type ProjectStatus =
  | "historical-production"
  | "release-candidate"
  | "private-self-hosted"
  | "developer-preview"
  | "public-client-preview"
  | "publication-gated";

interface ProjectAction {
  label: string;
  href: string;
  external: boolean;
}

interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  sources?: {
    avif: string;
    webp: string;
    sizes: string;
  };
}

interface FlagshipProjectBase {
  slug: string;
  title: string;
  eyebrow: string;
  status: ProjectStatus;
  statusLabel: string;
  summary: string;
  ownership: string;
  technologies: readonly string[];
  availability: string;
  contextNote?: string;
}

export interface PublishedFlagshipProject extends FlagshipProjectBase {
  publicationState: "published";
  publicationGate: null;
  card: FlagshipProjectCard;
  media:
    | {
        kind: "paired";
        label: string;
        caption: string;
        images: readonly ProjectImage[];
        route?: never;
      }
    | {
        kind: "historical";
        label: string;
        caption: string;
        images: readonly [ProjectImage];
        route?: never;
      }
    | {
        kind: "product";
        label: string;
        caption: string;
        images: readonly [ProjectImage];
        route?: never;
      }
    | {
        kind: "route";
        label: string;
        caption: string;
        images: readonly ProjectImage[];
        route: readonly string[];
      };
  primaryAction: ProjectAction;
  secondaryAction?: ProjectAction;
}

export interface GatedFlagshipProject extends FlagshipProjectBase {
  publicationState: "gated";
  publicationGate: string;
  card: null;
  media: null;
  primaryAction: null;
  secondaryAction?: never;
}

export type FlagshipProject = PublishedFlagshipProject | GatedFlagshipProject;

export const flagshipProjects: readonly FlagshipProject[] = [
  {
    slug: "eazegames-original-web-platform",
    title: "EazeGames",
    eyebrow: "PRODUCTION PLATFORM · HISTORICAL CASE STUDY",
    status: "historical-production",
    statusLabel: "ORIGINAL FRONTEND · 2016-2017",
    summary:
      "Frontend architecture and implementation of the original real-time skill-gaming SPA for competitions, game discovery, live player activity, payments, roles, and multilingual UX.",
    ownership: "Senior Frontend Developer · Original frontend architecture and implementation",
    technologies: ["React", "Redux", "WebSockets", "Webpack 2", "JavaScript"],
    availability:
      "Historical Version 1 case study. The current product has since been redesigned and is maintained by EazeGames.",
    publicationState: "published",
    publicationGate: null,
    card: flagshipProjectCardCopy.eazegames,
    media: {
      kind: "historical",
      label: "Sanitized archival EazeGames Version 1 competition and game-discovery hub",
      caption: "Original Version 1 interface · archival product evidence from 2016-2017.",
      images: [
        {
          src: "/work/eazegames/eazegames-card-1600x1200.webp",
          alt: "Sanitized archival EazeGames Version 1 competition and game-discovery interface",
          width: 1600,
          height: 1200,
          sources: {
            avif: "/work/eazegames/eazegames-card-1600x1200-960.avif 960w, /work/eazegames/eazegames-card-1600x1200.avif 1600w",
            webp: "/work/eazegames/eazegames-card-1600x1200-960.webp 960w, /work/eazegames/eazegames-card-1600x1200.webp 1600w",
            sizes: "(min-width: 900px) 50vw, 100vw",
          },
        },
      ],
    },
    primaryAction: {
      label: "View project →",
      href: "/work/eazegames-original-web-platform",
      external: false,
    },
    secondaryAction: {
      label: "Current product by EazeGames ↗",
      href: "https://eazegames.com/",
      external: true,
    },
  },
  {
    slug: "english-voice-coach",
    title: "English Voice Coach",
    eyebrow: "INDEPENDENT PRODUCT · ANDROID",
    status: "release-candidate",
    statusLabel: "PLAY CLOSED TEST · IN REVIEW",
    summary:
      "A private Android speaking coach that transcribes, corrects, explains, and turns better phrasing into repeat practice-on-device after setup.",
    ownership: "Independent product · Designed and implemented end to end",
    technologies: ["Flutter", "Android/JNI", "whisper.cpp", "LiteRT-LM", "On-device AI"],
    availability:
      "A Google Play closed-test release has been submitted for review. Public installation is not currently available; this overview uses screenshots of the current version.",
    publicationState: "published",
    publicationGate: null,
    card: flagshipProjectCardCopy.voiceCoach,
    media: {
      kind: "paired",
      label: "Two current English Voice Coach Android screens",
      caption: "Current Android application—not a concept mockup.",
      images: [
        {
          src: "/work/english-voice-coach-topics.jpg",
          alt: "English Voice Coach screen showing local model readiness and practice topics",
          width: 1080,
          height: 2160,
        },
        {
          src: "/work/english-voice-coach-correction.jpg",
          alt: "English Voice Coach feedback screen showing a correction, natural alternative, and explanation",
          width: 1080,
          height: 2160,
        },
      ],
    },
    primaryAction: { label: "View project →", href: "/work/english-voice-coach", external: false },
  },
  {
    slug: "llamail-local-ai-email-agent",
    title: "Llamail",
    eyebrow: "INDEPENDENT SYSTEM · LOCAL-FIRST APPLIED AI",
    status: "private-self-hosted",
    statusLabel: "LOCAL-FIRST AI · SELF-HOSTED",
    summary:
      "A Telegram-controlled email system with deterministic routing, hybrid retrieval, cited answers, and human-reviewed actions.",
    ownership: "Independent system · Architecture, backend, retrieval, agents, and operator workflow",
    technologies: ["Python", "FastAPI", "llama.cpp", "ChromaDB", "SQLite FTS5", "Telegram", "Gmail"],
    availability:
      "Self-hosted system, not a hosted service. No public live demo is offered because setup requires user-owned integrations and local model hardware.",
    contextNote: "Llamail is the email-agent system; Sable is its Telegram control surface and operator persona.",
    publicationState: "published",
    publicationGate: null,
    card: flagshipProjectCardCopy.llamail,
    media: {
      kind: "route",
      label: "Sanitized Sable Telegram capture with the Llamail request route",
      caption: "Sanitized product evidence from the implemented self-hosted workflow.",
      images: [
        {
          src: "/work/llamail-telegram.jpg",
          alt: "Sanitized Telegram capture of Sable returning cited email analysis and an operator report",
          width: 1080,
          height: 2340,
        },
      ],
      route: ["TELEGRAM", "FASTAPI", "ROUTER", "LOCAL LLM / HYBRID RAG"],
    },
    primaryAction: { label: "View project →", href: "/work/llamail", external: false },
    secondaryAction: { label: "Read the series →", href: "/articles/private-local-ai-email-agent", external: false },
  },
  zharwingMemoryProject,
  northPeakProject,
  {
    slug: "real-time-collaboration-architecture",
    title: "Real-Time Collaborative SaaS Architecture",
    eyebrow: "PRODUCTION EXPERIENCE · PUBLICATION REVIEW",
    status: "publication-gated",
    statusLabel: "PUBLICATION GATED",
    summary:
      "A reserved architecture slot for generalized real-time collaboration, shared frontend foundations, and edge delivery patterns.",
    ownership: "Lead frontend and platform architecture",
    technologies: ["React", "TypeScript", "Cloudflare Workers", "Durable Objects", "WebSockets"],
    availability: "Not part of the published portfolio surface yet.",
    publicationState: "gated",
    card: null,
    publicationGate:
      "Requires employer/confidentiality approval plus newly drawn, generalized evidence with no internal material or unsupported scale claims.",
    media: null,
    primaryAction: null,
  },
];

export const publishedFlagshipProjects = flagshipProjects
  .filter((project): project is PublishedFlagshipProject => project.publicationState === "published")
  .sort((left, right) => Number(right.card.tier === "featured") - Number(left.card.tier === "featured"));

export const gatedFlagshipProjects = flagshipProjects.filter(
  (project): project is GatedFlagshipProject => project.publicationState === "gated",
);
