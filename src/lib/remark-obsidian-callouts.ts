import type { Blockquote, PhrasingContent, Root } from "mdast";
import type { Node, Parent } from "unist";

function transformCallout(node: Blockquote) {
  const paragraph = node.children[0];
  const first = paragraph?.type === "paragraph" ? paragraph.children[0] : null;
  if (first?.type !== "text") return;

  const match = /^\[!([\w-]+)\]([+-]?)[ \t]*/.exec(first.value);
  if (!match || paragraph?.type !== "paragraph") return;

  const identifier = match[1].toLowerCase();
  const title: PhrasingContent[] = [];
  const body: PhrasingContent[] = [];
  let inBody = false;

  // The title and the first body line often share a Markdown paragraph.
  // Split before remark-breaks runs, preserving inline formatting in both.
  for (const [index, child] of paragraph.children.entries()) {
    const content =
      index === 0 && child.type === "text"
        ? { ...child, value: child.value.slice(match[0].length) }
        : child;

    if (inBody) {
      body.push(content);
    } else if (content.type === "break") {
      inBody = true;
    } else if (content.type === "text" && content.value.includes("\n")) {
      const newline = content.value.indexOf("\n");
      title.push({ ...content, value: content.value.slice(0, newline) });
      body.push({ ...content, value: content.value.slice(newline + 1) });
      inBody = true;
    } else {
      title.push(content);
    }
  }

  const hasContent = (children: PhrasingContent[]) =>
    children.some((child) => child.type !== "text" || child.value.trim());

  node.data = {
    ...node.data,
    hProperties: {
      ...node.data?.hProperties,
      "data-callout": identifier,
      "data-callout-fold": match[2],
    },
  };
  node.children = [
    {
      type: "paragraph",
      children: hasContent(title)
        ? title
        : [
            {
              type: "text",
              value: identifier[0].toUpperCase() + identifier.slice(1),
            },
          ],
    },
    ...(hasContent(body) ? [{ ...paragraph, children: body }] : []),
    ...node.children.slice(1),
  ];
}

function walk(node: Node) {
  if (node.type === "blockquote") transformCallout(node as Blockquote);
  if ("children" in node) {
    for (const child of (node as Parent).children) walk(child);
  }
}

export function remarkObsidianCallouts() {
  return (tree: Root) => walk(tree);
}
