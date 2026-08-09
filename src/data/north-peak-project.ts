import type { PublishedFlagshipProject } from "./flagship-projects";

export const northPeakProject = {
  slug: "north-peak-appliance-repair",
  title: "North Peak Appliance Repair",
  eyebrow: "COMMISSIONED CLIENT DELIVERY · WORDPRESS",
  status: "public-client-preview",
  statusLabel: "LIVE CLIENT WEBSITE",
  summary:
    "A custom WordPress website and responsive booking journey for a Greater Houston appliance-service business, including service guides and ZIP-based coverage.",
  ownership: "Web Architect & Full-Stack WordPress Developer · Commissioned client delivery",
  technologies: ["WordPress", "PHP", "JavaScript", "Responsive UX"],
  availability: "Live client website. Operational contact details and business configuration remain client-owned.",
  publicationState: "published",
  publicationGate: null,
  card: {
    tier: "supporting",
    meta: "CLIENT SITE · WORDPRESS · 2026",
    status: "LIVE CLIENT WEBSITE",
    summary: "A responsive service website with booking, service guides, and ZIP-based coverage.",
    ownership: "Architecture, implementation, and delivery",
    technologies: ["WordPress", "PHP", "JavaScript"],
  },
  media: {
    kind: "product",
    label: "Current public-safe North Peak Appliance Repair homepage",
    caption: "Fresh capture from the live client website.",
    images: [
      {
        src: "/work/north-peak/north-peak-homepage-showcase.png",
        alt: "North Peak Appliance Repair responsive homepage with service offer and booking call to action",
        width: 950,
        height: 712,
      },
    ],
  },
  primaryAction: {
    label: "View project →",
    href: "/work/north-peak-appliance-repair",
    external: false,
  },
  secondaryAction: {
    label: "Visit live website ↗",
    href: "https://northpeakfastrepair.com/",
    external: true,
  },
} satisfies PublishedFlagshipProject;
