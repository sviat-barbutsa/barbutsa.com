import { describe, expect, it } from "vitest";
import { sortPublishedArticles, takeRecentArticles, type ArticleEntry } from "@/lib/content/article-policy";
import { PAGE_SIZE } from "@/data/pagination";

const entries: ArticleEntry[] = [
  { id: "b", data: { date: new Date("2026-01-01") } },
  { id: "draft", data: { date: new Date("2027-01-01"), draft: true } },
  { id: "a", data: { date: new Date("2026-01-01") } },
  { id: "c", data: { date: new Date("2025-01-01") } },
];

describe("article policy", () => {
  it("filters drafts, sorts newest first, and breaks ties by id", () => {
    expect(sortPublishedArticles(entries).map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate input and applies recent limit", () => {
    const copy = entries.slice();
    expect(takeRecentArticles(entries, 2).map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(entries).toEqual(copy);
  });

  it("keeps pagination size stable", () => {
    expect(PAGE_SIZE).toBe(4);
  });
});
