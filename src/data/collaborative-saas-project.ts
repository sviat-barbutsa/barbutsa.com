import { flagshipProjectCardCopy } from "./flagship-project-card-copy";
import type { PublishedFlagshipProject } from "./flagship-projects";

export const collaborativeSaasProject = {
  slug: "collaborative-saas-frontend-platform",
  title: "Collaborative SaaS Frontend Platform",
  eyebrow: "COMMERCIAL SAAS · GENERALIZED CASE STUDY",
  status: "nda-protected",
  statusLabel: "NDA-PROTECTED COMMERCIAL WORK",
  summary:
    "Frontend architecture and hands-on delivery across a multi-application React and Next.js SaaS product, including shared frontend foundations, real-time workflows, platform services, and applied AI.",
  ownership:
    "Primary frontend architect and hands-on technical lead · Core architecture, major implementation, and mentoring",
  technologies: ["React", "Next.js", "TypeScript", "GraphQL", "WebSockets", "Cloudflare"],
  availability: "Generalized engineering scope; product identity and internal implementation remain confidential.",
  publicationState: "published",
  publicationGate: null,
  card: flagshipProjectCardCopy.collaborativeSaas,
  media: {
    kind: "scope",
    label:
      "Generalized architecture covering product applications, the frontend platform, real-time systems, platform services, and applied AI",
    caption: "Generalized engineering scope; the product interface and internal architecture remain confidential.",
    images: [
      {
        src: "/work/collaborative-saas-scope.svg",
        mobileSrc: "/work/collaborative-saas-scope-mobile.svg",
        mobileWidth: 1200,
        mobileHeight: 675,
        alt: "Generalized engineering scope for an NDA-protected collaborative SaaS frontend platform",
        width: 1600,
        height: 900,
      },
    ],
  },
  primaryAction: {
    label: "View role and engineering scope →",
    href: "/work/collaborative-saas-frontend-platform",
    external: false,
  },
} satisfies PublishedFlagshipProject;
