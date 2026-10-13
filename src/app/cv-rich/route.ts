import { readCvMarkdown } from "@/lib/cv";
import { renderTerminalMarkdown } from "@/lib/terminal-markdown";

export const dynamic = "force-static";

export async function GET() {
  const content = await readCvMarkdown();
  if (content === null) return new Response("CV not found", { status: 404 });

  return new Response(renderTerminalMarkdown(content), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
