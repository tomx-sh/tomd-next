import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), ".obsidian-content");
const articlesDirectory = path.join(contentDirectory, "articles");

export async function readMarkdownFile(filename: string) {
  const filePath = path.resolve(contentDirectory, filename);
  if (!filePath.startsWith(`${contentDirectory}${path.sep}`)) {
    throw new Error(`Markdown file must be inside ${contentDirectory}`);
  }

  const source = await readFile(filePath, "utf8");
  const { content, data } = matter(source);

  return {
    frontmatter: data as Record<string, unknown>,
    content,
  };
}

export async function getArticleSlugs() {
  const entries = await readdir(articlesDirectory, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        entry.name.toLowerCase() !== "index.md",
    )
    .map((entry) => entry.name.slice(0, -".md".length))
    .sort();
}
