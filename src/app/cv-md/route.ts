import matter from "gray-matter";
import { readCvMarkdown } from "@/lib/cv";

export const dynamic = "force-static";

export async function GET() {
  const content = await readCvMarkdown();
  if (content === null) return new Response("CV not found", { status: 404 });

  return new Response(matter(content).content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
