import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const contentDirectory = path.join(process.cwd(), "src/content");

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  url?: string;
  alt?: string;
  data?: {
    hProperties?: Record<string, number | string>;
  };
};

const obsidianLinkPattern = /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function imageUrl(target: string) {
  const normalizedTarget = target.replace(/^\.?\/?images\//, "");
  return `/images/${normalizedTarget
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function pageUrl(target: string) {
  const [filePath, heading] = target.split("#", 2);
  const normalizedPath = filePath
    .replace(/\.md$/i, "")
    .replace(/(^|\/)index$/i, "")
    .replace(/^\/+|\/+$/g, "");
  const pathname = normalizedPath
    ? `/${normalizedPath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")}`
    : "/";

  return heading ? `${pathname}#${encodeURIComponent(heading)}` : pathname;
}

function imageAlt(target: string) {
  return path.posix.basename(target, path.posix.extname(target));
}

function transformTextNode(node: MarkdownNode) {
  if (node.type !== "text" || !node.value) {
    return [node];
  }

  const replacements: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of node.value.matchAll(obsidianLinkPattern)) {
    const matchIndex = match.index ?? 0;
    const [raw, embedMarker, rawTarget, aliasOrWidth] = match;

    if (matchIndex > cursor) {
      replacements.push({
        type: "text",
        value: node.value.slice(cursor, matchIndex),
      });
    }

    const target = rawTarget.trim();
    if (embedMarker) {
      const width = Number.parseInt(aliasOrWidth ?? "", 10);
      replacements.push({
        type: "image",
        url: imageUrl(target),
        alt: imageAlt(target),
        ...(Number.isFinite(width) ? { data: { hProperties: { width } } } : {}),
      });
    } else {
      replacements.push({
        type: "link",
        url: pageUrl(target),
        children: [
          {
            type: "text",
            value: aliasOrWidth?.trim() || imageAlt(target),
          },
        ],
      });
    }

    cursor = matchIndex + raw.length;
  }

  if (cursor === 0) {
    return [node];
  }

  if (cursor < node.value.length) {
    replacements.push({ type: "text", value: node.value.slice(cursor) });
  }

  return replacements;
}

function transformObsidianLinks(node: MarkdownNode) {
  if (!node.children) {
    return;
  }

  node.children = node.children.flatMap((child) => transformTextNode(child));

  for (const child of node.children) {
    transformObsidianLinks(child);
  }
}

function remarkObsidianLinks() {
  return (tree: unknown) => {
    transformObsidianLinks(tree as MarkdownNode);
  };
}

export async function readMarkdownFile(filename: string) {
  const filePath = path.resolve(contentDirectory, filename);
  if (!filePath.startsWith(`${contentDirectory}${path.sep}`)) {
    throw new Error(`Markdown file must be inside ${contentDirectory}`);
  }

  const source = await readFile(filePath, "utf8");
  const { content, data } = matter(source);
  const rendered = await remark()
    .use(remarkObsidianLinks)
    .use(remarkGfm)
    .use(remarkHtml)
    .process(content);

  return {
    frontmatter: data as Record<string, unknown>,
    html: rendered.toString(),
  };
}
