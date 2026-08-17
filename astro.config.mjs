// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output; deployed as Cloudflare Workers static assets (see wrangler.jsonc).
// No SSR adapter - individual routes can adopt SSR later via @astrojs/cloudflare
// if a real server need appears.
export default defineConfig({
  site: "https://barbutsa.com",
  output: "static",
  trailingSlash: "never",
  integrations: [
    sitemap({
      // /articles/page/1 duplicates /articles; /styleguide is a living reference, not content
      filter: (page) => !["/articles/page/1", "/styleguide"].includes(new URL(page).pathname),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark-high-contrast",
    },
  },
  build: { format: "file" },
});
