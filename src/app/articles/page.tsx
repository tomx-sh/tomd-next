import path from "node:path";
import type { Metadata } from "next";
import { ArticleGraph } from "@/components/article-graph";
import { LocalizedDate } from "@/components/localized-date";
import { StyledLink } from "@/components/styled-link";
import { Badge } from "@/components/ui/badge";
import { buildArticleGraph, getArticleTags } from "@/lib/article-graph";
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
          tags: getArticleTags(content, frontmatter),
          content,
          frontmatter,
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
  const graph = buildArticleGraph(articles);

  return (
    <main className="markdown-page pt-0!">
      <div className="text-foreground">
        <ArticleGraph className="h-48 sm:h-56" data={graph} />
        {/* <h1 className="font-[650] text-4xl leading-[1.2] tracking-[-0.025em]">
          Articles
        </h1> */}
        <ul className="grid list-none grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2">
          {articles.map((article) => (
            <li
              className="col-span-3 grid grid-cols-subgrid items-baseline"
              key={article.slug}
            >
              {article.created ? (
                <LocalizedDate
                  className="font-mono text-sm opacity-60"
                  date={article.created.toISOString()}
                  format="numeric"
                />
              ) : (
                <span aria-hidden="true" />
              )}
              <StyledLink
                className="min-w-0 truncate"
                href={`/articles/${article.slug}`}
                title={article.title}
              >
                {article.title}
              </StyledLink>
              {article.tags[0] ? (
                <Badge className="justify-self-start" variant="secondary">
                  #{article.tags[0]}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
