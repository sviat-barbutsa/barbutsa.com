// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output; deployed as Cloudflare Workers static assets (see wrangler.jsonc).
// No SSR adapter on purpose — STACK_PLAN §2.2. Individual routes can adopt SSR
// later via @astrojs/cloudflare if a real server need appears (STACK_PLAN §7).
export default defineConfig({
  site: "https://sviatoslav.dev",
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap()],
  build: { format: "file" },
});
