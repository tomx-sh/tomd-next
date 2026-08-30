import path from "node:path";
import { notFound } from "next/navigation";
import { LocalizedDate } from "@/components/localized-date";
import { Markdown } from "@/components/markdown";
import { getArticleSlugs, readMarkdownFile } from "@/lib/markdown";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

function getCreatedDate(value: unknown) {
  if (!(value instanceof Date) && typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const slugs = await getArticleSlugs();

  if (!slugs.includes(slug)) {
    notFound();
  }

  const { frontmatter, content } = await readMarkdownFile(
    path.join("articles", `${slug}.md`),
  );
  const created = getCreatedDate(frontmatter.created);

  return (
    <main className="markdown-page">
      <article className="markdown">
        {created ? (
          <LocalizedDate
            className="block text-sm opacity-60"
            date={created.toISOString()}
          />
        ) : null}
        <Markdown>{content}</Markdown>
      </article>
    </main>
  );
}
