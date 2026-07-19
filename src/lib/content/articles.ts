import { getCollection, type CollectionEntry } from "astro:content";
import { sortPublishedArticles, takeRecentArticles } from "./article-policy";

export type ArticleEntry = CollectionEntry<"articles">;

export async function getPublishedArticles(): Promise<ArticleEntry[]> {
  return sortPublishedArticles(await getCollection("articles"));
}

export async function getRecentArticles(limit: number): Promise<ArticleEntry[]> {
  return takeRecentArticles(await getCollection("articles"), limit);
}
