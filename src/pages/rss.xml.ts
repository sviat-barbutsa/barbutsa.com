import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { site } from "@/data/site";
import { getPublishedArticles } from "@/lib/content/articles";

export async function GET(context: APIContext) {
  const articles = await getPublishedArticles();
  return rss({
    title: `${site.name} — Articles`,
    description: "Field reports on frontend architecture and AI systems.",
    site: context.site ?? site.url,
    items: articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.date,
      description: a.data.summary,
      link: `/articles/${a.id}`,
    })),
  });
}
