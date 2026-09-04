import type { Viewport } from "next";
import { DitheredFluid } from "@/components/dithered-fluid";
import { MarkdownHome } from "@/components/markdown-home";
import { readMarkdownFile } from "@/lib/markdown";

export const viewport: Viewport = {
  width: "device-width",
  height: "device-height",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function Home() {
  const { content } = await readMarkdownFile("index.md");

  return (
    <main className="fixed inset-x-0 top-0 h-[calc(100lvh+env(safe-area-inset-bottom))] overflow-hidden">
      <article className="safe-area-padding relative z-10">
        <MarkdownHome>{content}</MarkdownHome>
      </article>
      <DitheredFluid className="absolute inset-0 z-0" />
    </main>
  );
}
