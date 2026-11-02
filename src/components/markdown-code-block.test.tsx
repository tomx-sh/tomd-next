import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";
import { MarkdownHome } from "@/components/markdown-home";
import { highlightCode } from "@/lib/highlighter";

describe("Markdown code blocks", () => {
  for (const Renderer of [Markdown, MarkdownHome]) {
    it(`renders labelled and plain fences in ${Renderer.name} without nesting pre elements`, () => {
      const html = renderToStaticMarkup(
        <Renderer>
          {
            "Inline `value`.\n\n```ts\nconst value = 1;\n```\n\n```\nplain output\n```"
          }
        </Renderer>,
      );

      assert.ok(html.includes("<code>value</code>"));
      assert.equal((html.match(/data-slot="code-block"/g) ?? []).length, 2);
      assert.equal((html.match(/<pre\b/g) ?? []).length, 2);
      assert.equal((html.match(/aria-label="Copy"/g) ?? []).length, 2);
      assert.ok(html.includes(">ts</div>"));
      assert.ok(html.includes(">plain output</span>"));
      assert.ok(!html.includes("<pre><div"));
    });
  }

  it("escapes code, preserves blank lines, and renders unsupported languages", () => {
    const html = renderToStaticMarkup(
      <Markdown>
        {'```unknown-language\n<script>alert("x")</script>\n\nlast line\n```'}
      </Markdown>,
    );

    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(
      html.includes(
        'data-slot="code-block-line-content" class="min-w-0">\n</span>',
      ),
    );
    assert.ok(html.includes(">last line</span>"));
  });

  it("highlights supported aliases and falls back for unsupported languages", async () => {
    const lines = await highlightCode("const value = 1;", "ts");
    assert.ok(lines);
    const html = renderToStaticMarkup(lines);
    assert.ok(html.includes("--shiki-light"));
    assert.equal(await highlightCode("plain text", "unknown-language"), null);
  });
});
