import { Markdown } from "@/components/markdown";
import { readMarkdownFile } from "@/lib/markdown";

export default async function Home() {
  const { content } = await readMarkdownFile("index.md");

  return (
    <main className="markdown-page">
      <article>
        <Markdown>{content}</Markdown>
      </article>
    </main>
  );
}
