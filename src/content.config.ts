import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Articles — Markdown with typed frontmatter (STACK_PLAN §3).
 * A malformed date or missing summary fails the BUILD, not the page.
 */
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    category: z.string().min(1),
    readTime: z.string().regex(/^\d+ min$/),
    summary: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
