import { stripVTControlCharacters } from "node:util";
import { Chalk } from "chalk";
import matter from "gray-matter";
import { Marked, type MarkedExtension } from "marked";
import { markedTerminal } from "marked-terminal";
import wrapAnsi from "wrap-ansi";

// The server's stdout is unrelated to the terminal receiving the HTTP response.
const color = new Chalk({ level: 1 });
const markdown = new Marked(
  // The package's declarations still describe the older renderer API.
  markedTerminal({
    width: 72,
    reflowText: true,
    showSectionPrefix: false,
    tab: 2,
    emoji: false,
    blockquote: color.reset,
    heading: color.bold.cyan,
    firstHeading: color.bold.cyan,
    strong: color.bold,
    em: color.italic,
    codespan: color.yellow,
    del: color.strikethrough,
    link: color.reset,
    href: color.cyan.underline,
  }) as unknown as MarkedExtension,
  { breaks: true },
);
markdown.use({
  renderer: {
    text(token) {
      return "tokens" in token && token.tokens
        ? this.parser.parseInline(token.tokens)
        : token.text;
    },
    paragraph({ tokens }) {
      const text = this.parser.parseInline(tokens).replace(/\r/g, "\n");
      return `${wrapAnsi(text, 72, { hard: false })}\n\n`;
    },
    list({ items, ordered, start }) {
      const lines = items.map((item, index) => {
        const text = this.parser.parse(item.tokens, item.loose).trim();
        const checkbox = item.task ? `[${item.checked ? "x" : " "}] ` : "";
        const prefix = ordered ? `  ${Number(start) + index}. ` : "  • ";
        const wrapped = wrapAnsi(`${checkbox}${text}`, 68, { hard: false });
        const indent = " ".repeat(prefix.length);
        return `${prefix}${wrapped.replace(/\n/g, `\n${indent}`)}`;
      });
      return `${lines.join("\n")}\n\n`;
    },
    heading({ tokens, depth }) {
      const title = color.bold.cyan(this.parser.parseInline(tokens));
      const rule = depth <= 2 ? `\n${color.dim("─".repeat(72))}` : "";
      return `${title}${rule}\n\n`;
    },
  },
});

export function renderTerminalMarkdown(source: string) {
  const { content } = matter(stripVTControlCharacters(source));
  const normalized = content.replace(
    /^([ \t]*>[ \t]*)\[!([\w-]+)\][+-]?[ \t]*(.*)$/gm,
    (_, prefix: string, type: string, title: string) =>
      `${prefix}**${title || type[0].toUpperCase() + type.slice(1)}**`,
  );

  return `\n${markdown.parse(normalized, { async: false }).trim()}\n\n`;
}
