import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripVTControlCharacters } from "node:util";
import { renderTerminalMarkdown } from "./terminal-markdown";

describe("terminal Markdown", () => {
  it("formats CV content and hides publishing metadata and callout markers", () => {
    const output = renderTerminalMarkdown(
      "---\npublish: true\n---\n### Developer\n[GitHub](https://github.com/example)\n> [!summary]\n> - **Experience:** Six years\n\n## EXPERIENCE\n- Built *useful* tools",
    );
    const plain = stripVTControlCharacters(output);

    assert.ok(output.includes("\u001b["));
    for (const text of [
      "Developer",
      "https://github.com/example",
      "Summary",
      "Experience: Six years",
      "Built useful tools",
    ]) {
      assert.ok(plain.includes(text), text);
    }
    for (const text of ["publish:", "[!summary]", "**", "###"]) {
      assert.ok(!plain.includes(text), text);
    }
    assert.ok(output.endsWith("\n"));
  });

  it("wraps long bullets and keeps their continuation indented", () => {
    const plain = stripVTControlCharacters(
      renderTerminalMarkdown(
        `> [!summary]\n> - **Skills:** ${"word ".repeat(40)}`,
      ),
    );
    const lines = plain.split("\n").filter((line) => line.trim());
    assert.ok(lines.every((line) => line.length <= 80));
    assert.ok(lines.filter((line) => line.includes("word")).length > 1);
    assert.ok(
      lines
        .filter((line) => line.includes("word"))
        .every((line) => /^\s/.test(line)),
    );
  });
});
