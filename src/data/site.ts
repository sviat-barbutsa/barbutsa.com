/** Site-wide identity + navigation. One import, everywhere. */

export const site = {
  name: "Sviatoslav Barbutsa",
  role: "Lead Software Engineer · Frontend Architect · Applied AI",
  email: "sviatoslav.barbutsa@gmail.com", // same as in the CV; swap to a domain address when mail is set up
  url: "https://barbutsa.com",
  description:
    "Sviatoslav Barbutsa designs and ships complex product interfaces, SaaS platforms, real-time systems, and practical AI capabilities.",
  positioning:
    "I design and ship complex product interfaces, SaaS platforms, real-time systems, and practical AI capabilities from architecture through production.",
  facts: {
    location: "Houston, TX · remote · U.S. work authorization",
    proof: "StackOverflow 5k+ reputation · Upwork 100% Job Success",
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/work", label: "Work" },
    { href: "/architecture", label: "Architecture" },
    { href: "/articles", label: "Writing" },
    { href: "/lab", label: "Tools" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  social: [
    { href: "mailto:sviatoslav.barbutsa@gmail.com", label: "Email" },
    { href: "https://github.com/sviat-barbutsa", label: "GitHub" },
    {
      href: "https://www.linkedin.com/in/sviatoslav-barbutsa/",
      label: "LinkedIn",
    },
    {
      href: "https://stackoverflow.com/users/5232122/velidan",
      label: "StackOverflow",
    },
    {
      href: "https://www.upwork.com/freelancers/~013ff3b6a6623f2810",
      label: "Upwork",
    },
  ],
} as const;
