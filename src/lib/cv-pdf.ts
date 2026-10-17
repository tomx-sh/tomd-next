import { readFile } from "node:fs/promises";
import path from "node:path";
import init, { HtmlConverter } from "ironpress/node";
import postcss from "postcss";
import postcssNesting from "postcss-nesting";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { markdownPlugins } from "@/lib/markdown-plugins";

const fontFaces = ["Regular", "SemiBold", "Bold", "Italic"];
const pdfScale = 0.85;

const markdown = unified()
  .use(remarkParse)
  .use(markdownPlugins)
  .use(remarkRehype, {
    handlers: {
      heading(state, node) {
        const children = state.all(node);
        return {
          type: "element",
          tagName: `h${node.depth}`,
          properties: {},
          children:
            node.depth === 2
              ? [{ type: "element", tagName: "span", properties: {}, children }]
              : children,
        };
      },
    },
  })
  .use(rehypeStringify);

export async function renderCvPdf(content: string) {
  const [body, typeset, typography, ...fonts] = await Promise.all([
    markdown.process(content),
    readFile(path.join(process.cwd(), "src/app/typeset.css"), "utf8"),
    readFile(path.join(process.cwd(), "src/app/markdown.css"), "utf8"),
    ...fontFaces.map((weight) =>
      readFile(
        path.join(
          process.cwd(),
          `src/assets/cv-fonts/IBMPlexSans-${weight}.ttf`,
        ),
      ),
    ),
  ]);

  // The shared Typeset CSS uses nesting, which Ironpress does not interpret.
  const styles = await postcss([postcssNesting()]).process(
    `${typeset}\n${typography}`,
    { from: undefined },
  );

  await init();
  const converter = new HtmlConverter();
  try {
    converter.pageSize("A4");
    converter.margin((15 / 25.4) * 72);
    // Ironpress keys custom fonts by name, so each face needs its own family.
    for (const [index, font] of fonts.entries()) {
      converter.addFont(`IBM Plex Sans ${fontFaces[index]}`, font);
    }

    const pdf = converter.htmlToPdf(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Thomas — CV</title>
<style>
${styles.css}
:root {
  --font-ibm-plex-sans: "IBM Plex Sans Regular";
  --font-ibm-plex-mono: monospace;
  --color-foreground: #252525;
  --color-muted-foreground: #737373;
  --color-border: #d4d4d4;
  font-size: ${16 * pdfScale}px;
}
body { margin: 0; font-family: "IBM Plex Sans Regular", sans-serif; }
.typeset { font-size: ${15 * pdfScale}px; max-width: 42em; }
.typeset :is(h1, h2, h3, h4, h5, h6) { font-family: "IBM Plex Sans SemiBold"; }
.typeset :is(strong, b) { font-family: "IBM Plex Sans Bold"; }
.typeset :is(em, i) { font-family: "IBM Plex Sans Italic"; font-style: normal; }
h1, h2, h3 { break-after: avoid; }
p, li { break-inside: avoid; }
</style></head><body>
<main class="typeset typeset-article typeset-cv">${body}</main>
</body></html>`);

    if (new TextDecoder().decode(pdf.subarray(0, 5)) !== "%PDF-") {
      throw new Error("Ironpress did not generate a valid PDF");
    }
    return pdf;
  } finally {
    converter.free();
  }
}
