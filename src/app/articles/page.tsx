import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { getArticleSlugs, readMarkdownFile } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Articles",
};

function getTitle(content: string, slug: string) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1];

  return heading ?? slug.replaceAll("-", " ");
}

function getCreatedDate(value: unknown) {
  if (!(value instanceof Date) && typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export default async function ArticlesPage() {
  const slugs = await getArticleSlugs();
  const articles = (
    await Promise.all(
      slugs.map(async (slug) => {
        const { frontmatter, content } = await readMarkdownFile(
          path.join("articles", `${slug}.md`),
        );

        return {
          slug,
          title:
            typeof frontmatter.title === "string"
              ? frontmatter.title
              : getTitle(content, slug),
          created: getCreatedDate(frontmatter.created),
          published: frontmatter.publish !== false,
        };
      }),
    )
  )
    .filter((article) => article.published)
    .sort(
      (first, second) =>
        (second.created?.valueOf() ?? 0) - (first.created?.valueOf() ?? 0),
    );

  return (
    <main className="markdown-page">
      <div className="markdown">
        <h1>Articles</h1>
        <ul className="list-none p-0">
          {articles.map((article) => (
            <li key={article.slug}>
              <Link href={`/articles/${article.slug}`}>{article.title}</Link>
              {article.created ? (
                <time
                  className="block text-sm opacity-60"
                  dateTime={article.created.toISOString()}
                >
                  {article.created.toLocaleDateString("en", {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })}
                </time>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
