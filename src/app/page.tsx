import { DitheredPaint } from "@/components/dithered-paint";
import { MarkdownHome } from "@/components/markdown-home";
import { readMarkdownFile } from "@/lib/markdown";

export default async function Home() {
  const { content } = await readMarkdownFile("index.md");

  return (
    <main className="relative h-screen overflow-hidden">
      <article className="relative z-10 p-4">
        <MarkdownHome>{content}</MarkdownHome>
      </article>
      <DitheredPaint className="absolute inset-0" />
    </main>
  );
}
