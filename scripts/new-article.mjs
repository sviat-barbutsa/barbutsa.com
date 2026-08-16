import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Article scaffolding + read-time maintenance.
//   pnpm new:article "Title" [--category "Name"]  - create a draft with valid frontmatter
//   pnpm new:article --retime                     - recompute readTime for every article
const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "src", "content", "articles");
const WORDS_PER_MINUTE = 200;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function computeReadTime(body) {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min`;
}

function retimeAll() {
  let changed = 0;
  for (const name of readdirSync(ARTICLES_DIR)) {
    if (!name.endsWith(".md")) continue;
    const file = path.join(ARTICLES_DIR, name);
    const text = readFileSync(file, "utf8");
    const match = FRONTMATTER.exec(text);
    if (!match) continue;
    const readTime = computeReadTime(text.slice(match[0].length));
    const updated = text.replace(/^readTime:.*$/m, `readTime: "${readTime}"`);
    if (updated !== text) {
      writeFileSync(file, updated);
      console.log(`${name}: readTime -> "${readTime}"`);
      changed += 1;
    }
  }
  console.log(changed ? `Updated ${changed} article(s).` : "All read times already correct.");
}

function createArticle(title, category) {
  const slug = slugify(title);
  if (!slug) {
    console.error("Title must contain at least one alphanumeric character.");
    process.exit(1);
  }
  const file = path.join(ARTICLES_DIR, `${slug}.md`);
  if (existsSync(file)) {
    console.error(`Refusing to overwrite existing article: src/content/articles/${slug}.md`);
    process.exit(1);
  }
  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${todayIso()}`,
    `category: "${category}"`,
    'readTime: "1 min"',
    'summary: "TODO: one-line summary."',
    "draft: true",
    "---",
    "",
    "Write the article here.",
    "",
  ].join("\n");
  writeFileSync(file, frontmatter);
  mkdirSync(path.join(ARTICLES_DIR, slug), { recursive: true });
  console.log(`Created src/content/articles/${slug}.md (draft: true)`);
  console.log(`Images go in src/content/articles/${slug}/ - reference as ./${slug}/name.png`);
  console.log('Before publishing: write the summary, run "pnpm new:article --retime", flip draft.');
}

const args = process.argv.slice(2);
if (args[0] === "--retime") {
  retimeAll();
} else {
  const categoryIndex = args.indexOf("--category");
  const category = categoryIndex >= 0 ? (args[categoryIndex + 1] ?? "") : "General";
  const title = args
    .filter((arg, i) => categoryIndex < 0 || (i !== categoryIndex && i !== categoryIndex + 1))
    .join(" ");
  if (!title || !category) {
    console.error('Usage: pnpm new:article "Article Title" [--category "Name"] | --retime');
    process.exit(1);
  }
  createArticle(title, category);
}
