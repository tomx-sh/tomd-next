import { readFile } from "node:fs/promises";
import path from "node:path";
import postcssOklabFunction from "@csstools/postcss-oklab-function";
import init, { HtmlConverter } from "ironpress/node";
import postcss from "postcss";
import postcssLogical from "postcss-logical";
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
  const [body, typeset, typography, theme, ...fonts] = await Promise.all([
    markdown.process(content),
    readFile(path.join(process.cwd(), "src/app/typeset.css"), "utf8"),
    readFile(path.join(process.cwd(), "src/app/markdown.css"), "utf8"),
    readFile(path.join(process.cwd(), "src/app/globals.css"), "utf8"),
    ...fontFaces.map((weight) =>
      readFile(
        path.join(
          process.cwd(),
          `src/assets/cv-fonts/IBMPlexSans-${weight}.ttf`,
        ),
      ),
    ),
  ]);

  const lightTheme = postcss
    .parse(theme)
    .nodes.filter((node) => node.type === "rule" && node.selector === ":root")
    .map((node) => node.toString())
    .join("\n");

  // Keep the page's styles, translating CSS features Ironpress cannot parse.
  const styles = await postcss([
    postcssNesting(),
    postcssLogical(),
    postcssOklabFunction({
      enableProgressiveCustomProperties: false,
      subFeatures: { displayP3: false },
    }),
  ]).process(
    `
${lightTheme}
* { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
${typeset}
${typography}
:root {
  --font-ibm-plex-sans: "IBM Plex Sans Regular";
  --font-ibm-plex-mono: monospace;
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  font-size: ${16 * pdfScale}px;
}
body { font-family: "IBM Plex Sans Regular", sans-serif; }
.typeset { font-size: ${15 * pdfScale}px; max-width: 42em; }
.typeset > :first-child { margin-top: 0; }
.typeset :is(h1, h2, h3, h4, h5, h6) { font-family: "IBM Plex Sans SemiBold"; }
.typeset :is(strong, b) { font-family: "IBM Plex Sans Bold"; }
.typeset :is(em, i) { font-family: "IBM Plex Sans Italic"; font-style: normal; }
.typeset a { color: var(--color-primary); font-weight: inherit; text-decoration: none; }
.typeset-cv h2::after { border-top: 1px solid currentColor; opacity: 0.6; }
h1, h2, h3 { break-after: avoid; }
p, li { break-inside: avoid; }
`,
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
