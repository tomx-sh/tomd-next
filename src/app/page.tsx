import { readMarkdownFile } from "@/lib/markdown";

export default async function Home() {
  const { html } = await readMarkdownFile("index.md");

  return (
    <main className="markdown-page">
      <article
        className="markdown"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: remark-html sanitizes the trusted Markdown source before it reaches React.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
