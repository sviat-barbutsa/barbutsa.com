import { flagshipProjectCardCopy } from "./flagship-project-card-copy";
import type { PublishedFlagshipProject } from "./flagship-projects";

export const piggyProject = {
  slug: "piggy-original-loyalty-frontend",
  title: "Piggy.eu",
  eyebrow: "LOYALTY PLATFORM · HISTORICAL FRONTEND CASE STUDY",
  status: "historical-production",
  statusLabel: "ORIGINAL FRONTEND · 2018–2019",
  summary:
    "The original Piggy.eu loyalty and discount web frontend: a React, TypeScript, and MobX application with a custom shared UI foundation.",
  ownership: "Senior Front-End Web Developer / Frontend Tech Lead · Original web frontend architecture and delivery",
  technologies: ["React", "TypeScript", "MobX", "Webpack", "Jenkins"],
  availability: "Original frontend contribution, 2018–2019. Piggy.eu remains active today.",
  publicationState: "published",
  publicationGate: null,
  card: flagshipProjectCardCopy.piggy,
  media: {
    kind: "product",
    label: "Piggy.eu today",
    caption: "Piggy.eu today. I created the original web frontend and shared UI foundation in 2018–2019.",
    images: [
      {
        src: "/work/piggy/piggy-current-homepage.webp",
        alt: "Piggy.eu homepage today",
        width: 1248,
        height: 702,
        sources: {
          avif: "/work/piggy/piggy-current-homepage-960.avif 960w, /work/piggy/piggy-current-homepage.avif 1248w",
          webp: "/work/piggy/piggy-current-homepage-960.webp 960w, /work/piggy/piggy-current-homepage.webp 1248w",
          sizes: "(min-width: 900px) 50vw, 100vw",
        },
      },
    ],
  },
  primaryAction: {
    label: "View project →",
    href: "/work/piggy-original-loyalty-frontend",
    external: false,
  },
  secondaryAction: {
    label: "Visit Piggy.eu today ↗",
    href: "https://www.piggy.eu/",
    external: true,
  },
} satisfies PublishedFlagshipProject;
