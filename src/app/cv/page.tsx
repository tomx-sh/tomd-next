import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { readMarkdownFile } from "@/lib/markdown";
import { CvHeader } from "./header";

export default async function CvPage() {
  let content: string;
  try {
    ({ content } = await readMarkdownFile("cv.md"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw error;
  }

  return (
    <>
      <CvHeader />
      <main className="markdown-page">
        <article>
          <Markdown variant="cv">{content}</Markdown>
        </article>
      </main>
    </>
  );
}
