import assert from "node:assert/strict";
import { it } from "node:test";
import { renderCvPdf } from "./cv-pdf";

it("creates a complete PDF with links and separate embedded IBM Plex faces", async () => {
  const pdf = await renderCvPdf(
    "# Résumé\n\nRegular text · École\n\n## Experience\n\n**Engineer** and *consultant*\n\n[Website](https://tomd.sh)",
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
});
