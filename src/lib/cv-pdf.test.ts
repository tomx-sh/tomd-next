import assert from "node:assert/strict";
import { it } from "node:test";
import { inflateSync } from "node:zlib";
import { renderCvPdf } from "./cv-pdf";

function drawingCommands(pdf: Uint8Array) {
  const bytes = Buffer.from(pdf);
  const source = bytes.toString("latin1");
  const commands: string[] = [];
  for (const match of source.matchAll(
    /\d+\s+0\s+obj\s*(<<[\s\S]*?>>)\s*stream\r?\n/g,
  )) {
    const length = Number(match[1].match(/\/Length\s+(\d+)/)?.[1]);
    const start = match.index + match[0].length;
    const data = bytes.subarray(start, start + length);
    const decoded = (
      match[1].includes("/FlateDecode") ? inflateSync(data) : data
    ).toString("latin1");
    if (decoded.includes("BT") || match[1].includes("/Subtype /Form")) {
      commands.push(decoded);
    }
  }
  return commands.join("\n");
}

it("preserves CV fonts, orange links, section rules, indentation and spacing", async () => {
  const pdf = await renderCvPdf(
    "# Résumé\n\nRegular text · École\n\n## Experience\n\n### Engineer\n\n**Engineer** and *consultant*\n\n[Website](https://tomd.sh)",
  );
  const source = new TextDecoder().decode(pdf);
  assert.ok(source.startsWith("%PDF-"));
  assert.ok(source.trimEnd().endsWith("%%EOF"));
  assert.ok(source.includes("https://tomd.sh"));
  const fonts = new Set(
    [
      ...source.matchAll(/\/BaseFont\s*\/[A-Z]+\+(IBMPlexSans(?:-[^\s/]+)?)/g),
    ].map((match) => match[1]),
  );
  assert.deepEqual(
    fonts,
    new Set([
      "IBMPlexSans",
      "IBMPlexSans-SmBld",
      "IBMPlexSans-Bold",
      "IBMPlexSans-Italic",
    ]),
  );

  const commands = drawingCommands(pdf);
  const colors = [...commands.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) rg/g)];
  assert.ok(
    colors.some(
      ([, red, green, blue]) =>
        Number(red) > 0.8 &&
        Number(green) > 0.1 &&
        Number(green) < 0.5 &&
        Number(blue) < 0.1,
    ),
    "links must be orange",
  );
  const rectangles = [
    ...commands.matchAll(/[\d.]+ [\d.]+ ([\d.]+) ([\d.]+) re/g),
  ];
  assert.ok(
    rectangles.some(
      ([, width, height]) =>
        Number(width) > 100 && Number(height) > 0 && Number(height) < 1,
    ),
    "section heading must have a visible horizontal rule",
  );
  const headings = [
    ...commands.matchAll(
      /\/ibmplexsanssemibold [\d.]+ Tf\s+1 0 0 -1 ([\d.]+) ([\d.]+) Tm/g,
    ),
  ];
  assert.equal(headings.length, 2);
  assert.ok(
    Math.abs(Number(headings[1][1]) - Number(headings[0][1]) - 27.2) < 0.01,
    "section content must retain the scaled 2rem indentation",
  );
  const paragraph = commands.match(
    /\/ibmplexsansbold [\d.]+ Tf\s+1 0 0 -1 ([\d.]+) ([\d.]+) Tm/,
  );
  assert.ok(paragraph);
  assert.equal(Number(paragraph[1]), Number(headings[1][1]));
  const gap = Number(paragraph[2]) - Number(headings[1][2]);
  assert.ok(gap > 15 && gap < 22, "h3 must not gain extra paragraph spacing");
});
