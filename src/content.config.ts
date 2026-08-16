import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Articles - Markdown with typed frontmatter.
 * A malformed date or missing summary fails the build.
 */
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      date: z.coerce.date(),
      category: z.string().min(1),
      readTime: z.string().regex(/^\d+ min$/),
      // SERP-bounded: Google truncates result descriptions around ~155 chars.
      summary: z.string().min(1).max(160),
      draft: z.boolean().default(false),
      // Optional hero/OG image; a broken path fails the build like any other field.
      cover: image().optional(),
    }),
});

export const collections = { articles };
