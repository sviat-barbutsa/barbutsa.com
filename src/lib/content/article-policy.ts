export interface ArticleEntry {
  id: string;
  data: {
    draft?: boolean;
    date: Date;
  };
}

export function sortPublishedArticles<T extends ArticleEntry>(entries: readonly T[]): T[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .slice()
    .sort((a, b) => {
      const byDate = b.data.date.valueOf() - a.data.date.valueOf();
      return byDate || a.id.localeCompare(b.id);
    });
}

export function takeRecentArticles<T extends ArticleEntry>(entries: readonly T[], limit: number): T[] {
  return sortPublishedArticles(entries).slice(0, Math.max(0, limit));
}
