import matter from "gray-matter";
import { readCvMarkdown } from "@/lib/cv";
import { renderCvPdf } from "@/lib/cv-pdf";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const source = await readCvMarkdown();
  if (source === null) return new Response("CV not found", { status: 404 });

  const pdf = await renderCvPdf(matter(source).content);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cv-tomd.pdf"',
    },
  });
}
