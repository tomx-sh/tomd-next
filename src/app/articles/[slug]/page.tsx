import path from "node:path";
import { notFound } from "next/navigation";
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const slugs = await getArticleSlugs();

  if (!slugs.includes(slug)) {
    notFound();
  }

  const { content } = await readMarkdownFile(
    path.join("articles", `${slug}.md`),
  );

  return (
    <main className="markdown-page">
      <article className="markdown">
        <Markdown>{content}</Markdown>
      </article>
    </main>
  );
}
