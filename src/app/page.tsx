import { DitheredFluid } from "@/components/dithered-fluid";
import { MarkdownHome } from "@/components/markdown-home";
import { readMarkdownFile } from "@/lib/markdown";

export default async function Home() {
  const { content } = await readMarkdownFile("index.md");

  return (
    <main className="grid h-dvh min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <article className="p-4">
        <MarkdownHome>{content}</MarkdownHome>
      </article>
      <DitheredFluid className="min-h-0 min-w-0" />
    </main>
  );
}
