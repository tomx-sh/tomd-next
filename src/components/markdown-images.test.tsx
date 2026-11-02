import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";
import { MarkdownHome } from "@/components/markdown-home";

describe("Vault image paths", () => {
  for (const Renderer of [Markdown, MarkdownHome]) {
    it(`resolves relative Markdown image paths in ${Renderer.name}`, () => {
      for (const prefix of [
        "images/",
        "./images/",
        "../images/",
        "../../images/",
      ]) {
        const html = renderToStaticMarkup(
          <Renderer>{`![Screenshot](${prefix}nested/example%20image.png)`}</Renderer>,
        );
        assert.ok(
          html.includes('src="/obsidian-images/nested/example%20image.png"'),
        );
        assert.ok(html.includes('alt="Screenshot"'));
      }
    });
  }

  it("preserves external and site-owned image URLs", () => {
    for (const url of [
      "https://example.com/images/photo.png",
      "/images/photo.png",
      "/obsidian-images/photo.png",
    ]) {
      const html = renderToStaticMarkup(
        <Markdown>{`![Photo](${url})`}</Markdown>,
      );
      assert.ok(html.includes(`src="${url}"`));
    }
  });

  it("resolves Obsidian image embeds and preserves width aliases", () => {
    const html = renderToStaticMarkup(
      <Markdown>{"![[../images/example image.png|320]]"}</Markdown>,
    );
    assert.ok(html.includes('src="/obsidian-images/example%20image.png"'));
    assert.ok(html.includes('width="320"'));
  });
});
