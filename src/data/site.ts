/** Site-wide identity + navigation. One import, everywhere. */

export const site = {
  name: "Sviatoslav Barbutsa",
  role: "Senior Frontend Architect & AI Engineer",
  email: "sviatoslav.barbutsa@gmail.com", // CV-canonical; swap to a domain address when mail is set up
  url: "https://sviatoslav.dev",
  description:
    "Sviatoslav Barbutsa builds systems that stay understandable. React and TypeScript architecture, AI product systems, Cloudflare-first SaaS.",
  positioning:
    "Thirteen years of commercial software. Boring tools where they matter, ambitious pieces isolated enough to be reliable.",
  facts: {
    location: "Houston, TX · remote · U.S. work authorization",
    proof: "StackOverflow 5k+ reputation · Upwork 100% Job Success",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/lab", label: "Lab" },
    { href: "/packages", label: "Packages" },
    { href: "/articles", label: "Articles" },
    { href: "/architecture", label: "Architecture" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  social: [
    { href: "mailto:sviatoslav.barbutsa@gmail.com", label: "Email" },
    { href: "https://github.com/sviat-barbutsa", label: "GitHub" },
    { href: "https://www.linkedin.com/in/sviatoslav-barbutsa/", label: "LinkedIn" },
    { href: "https://stackoverflow.com/users/5232122/velidan", label: "StackOverflow" },
    { href: "https://www.upwork.com/freelancers/~013ff3b6a6623f2810", label: "Upwork" },
  ],
} as const;
