import { DitheredFluid } from "@/components/dithered-fluid";
import { MarkdownHome } from "@/components/markdown-home";
import { readMarkdownFile } from "@/lib/markdown";

export default async function Home() {
  const { content } = await readMarkdownFile("index.md");

  return (
    // <main className="grid h-dvh min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
    <main className="relative h-dvh w-full overflow-hidden">
      <article className="p-4 relative z-10">
        <MarkdownHome>{content}</MarkdownHome>
      </article>
      <DitheredFluid className="absolute inset-0 z-0" />
    </main>
  );
}
