import path from "node:path";
import type { Metadata } from "next";
import { LocalizedDate } from "@/components/localized-date";
import { StyledLink } from "@/components/styled-link";
import { Badge } from "@/components/ui/badge";
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

function getFirstTag(content: string) {
  let fence: "```" | "~~~" | null = null;

  for (const line of content.split("\n")) {
    const fenceMarker = line.trimStart().slice(0, 3);

    if (fenceMarker === "```" || fenceMarker === "~~~") {
      if (!fence || fence === fenceMarker) {
        fence = fence === fenceMarker ? null : fenceMarker;
      }
      continue;
    }

    if (!fence) {
      const tag = line.match(/(?:^|\s)#([\p{L}\p{N}][\p{L}\p{N}_/-]*)\b/u)?.[1];
      if (tag) return tag;
    }
  }

  return null;
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
          tag: getFirstTag(content),
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
      <div className="text-foreground">
        <h1 className="font-[650] text-4xl leading-[1.2] tracking-[-0.025em]">
          Articles
        </h1>
        <ul className="mt-6 list-none p-0 text-lg leading-[1.8]">
          {articles.map((article) => (
            <li className="flex items-baseline" key={article.slug}>
              {article.created ? (
                <LocalizedDate
                  className="mr-2 font-mono text-sm opacity-60"
                  date={article.created.toISOString()}
                  format="numeric"
                />
              ) : null}
              <StyledLink
                className="min-w-0 truncate"
                href={`/articles/${article.slug}`}
                title={article.title}
              >
                {article.title}
              </StyledLink>
              {article.tag ? (
                <Badge className="ml-auto" variant="secondary">
                  #{article.tag}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
