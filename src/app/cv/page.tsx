import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { readMarkdownFile } from "@/lib/markdown";

export default async function CvPage() {
  let content: string;
  try {
    ({ content } = await readMarkdownFile("cv.md"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw error;
  }

  return (
    <main className="markdown-page">
      <article>
        <Markdown>{content}</Markdown>
      </article>
    </main>
  );
}
