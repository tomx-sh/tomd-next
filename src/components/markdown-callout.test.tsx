import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";
import { MarkdownHome } from "@/components/markdown-home";

const render = (source: string) =>
  renderToStaticMarkup(<Markdown>{source}</Markdown>);

describe("Obsidian callouts", () => {
  it("renders every standard type and alias", () => {
    const groups = {
      note: ["note"],
      abstract: ["abstract", "summary", "tldr"],
      info: ["info"],
      todo: ["todo"],
      tip: ["tip", "hint", "important"],
      success: ["success", "check", "done"],
      question: ["question", "help", "faq"],
      warning: ["warning", "caution", "attention"],
      failure: ["failure", "fail", "missing"],
      danger: ["danger", "error"],
      bug: ["bug"],
      example: ["example"],
      quote: ["quote", "cite"],
    };

    for (const [canonical, identifiers] of Object.entries(groups)) {
      for (const identifier of identifiers) {
        const html = render(`> [!${identifier}]\n> Body`);
        assert.ok(html.includes(`data-callout="${canonical}"`), identifier);
        assert.ok(
          html.includes(
            `>${identifier[0].toUpperCase()}${identifier.slice(1)}</div>`,
          ),
        );
        assert.ok(html.includes("<svg"));
        assert.ok(html.includes("<p>Body</p>"));
        assert.ok(!html.includes("[!"));
      }
    }
  });

  it("handles case-insensitive identifiers and unknown types", () => {
    assert.ok(
      render("> [!WaRnInG] Watch out").includes('data-callout="warning"'),
    );
    for (const type of ["custom", "custom-type", "constructor"]) {
      assert.ok(render(`> [!${type}]`).includes('data-callout="note"'));
    }
  });

  it("preserves formatted titles, the first body line, and Obsidian links", () => {
    const html = render(
      "> [!tip] **Read** `this`\n> First **body** line\n> See [[articles/local-ai|local AI]].\n>\n> Next paragraph.",
    );
    assert.ok(html.includes("<strong>Read</strong> <code>this</code>"));
    assert.ok(html.includes("<p>First <strong>body</strong> line<br/>"));
    assert.ok(html.includes('href="/articles/local-ai"'));
    assert.ok(html.includes("<p>Next paragraph.</p>"));
  });

  it("supports title-only callouts and hard line breaks after the title", () => {
    const titleOnly = render("> [!tip] Just a title");
    assert.ok(titleOnly.includes(">Just a title</div>"));
    assert.ok(!titleOnly.includes('data-slot="alert-description"'));
    const hardBreak = render("> [!note] Title  \n> Body");
    assert.ok(hardBreak.includes(">Title</div>"));
    assert.ok(hardBreak.includes("<p>Body</p>"));
  });

  it("renders nested callouts, lists, tables, images, and code as Markdown", () => {
    const html = render(
      "> [!example] Rich content\n>\n> - One\n> - Two\n>\n> | A | B |\n> | - | - |\n> | 1 | 2 |\n>\n> ![[images/example.png]]\n>\n> ```\n> [!warning] literal code\n> ```\n>\n> > [!success] Nested\n> > Nested body",
    );
    assert.ok(html.includes("<ul>"));
    assert.ok(html.includes("<table>"));
    assert.ok(html.includes('src="/obsidian-images/example.png"'));
    assert.ok(html.includes("<pre><code>[!warning] literal code"));
    assert.ok(html.includes('data-callout="success"'));
    assert.ok(html.includes("<p>Nested body</p>"));
  });

  it("uses the requested initial state for foldable callouts", () => {
    const open = render("> [!question]+ Open\n> Body");
    const closed = render("> [!question]- Closed\n> Body");
    assert.ok(open.includes('aria-expanded="true"'));
    assert.ok(closed.includes('aria-expanded="false"'));
    assert.ok(!open.includes(" hidden="));
    assert.ok(closed.includes(" hidden="));
    assert.ok(closed.includes("<p>Body</p>"));
  });

  it("keeps ordinary blockquotes, inline markers, and code unchanged", () => {
    const html = render(
      "> Ordinary **quote**.\n\nText [!note].\n\n`[!tip]`\n\n```\n> [!warning]\n```",
    );
    assert.ok(html.includes("<blockquote>"));
    assert.ok(html.includes("Ordinary <strong>quote</strong>."));
    assert.ok(html.includes("Text [!note]."));
    assert.ok(html.includes("<code>[!tip]</code>"));
    assert.ok(html.includes("&gt; [!warning]"));
    assert.ok(!html.includes("data-callout="));
  });

  it("supports callouts on the home page", () => {
    const html = renderToStaticMarkup(
      <MarkdownHome>{"> [!info] Home\n> Content"}</MarkdownHome>,
    );
    assert.ok(html.includes('data-callout="info"'));
    assert.ok(html.includes("<p>Content</p>"));
  });
});
