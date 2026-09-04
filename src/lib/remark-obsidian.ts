type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  url?: string;
  alt?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, number | string>;
  };
};

const obsidianSyntaxPattern =
  /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|(?<![\p{L}\p{N}_-])(#[\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu;

function imageUrl(target: string) {
  const normalizedTarget = target.replace(/^\.?\/?images\//, "");
  return `/obsidian-images/${normalizedTarget
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
  const filename = target.split("/").at(-1) ?? target;
  return filename.replace(/\.[^.]+$/, "");
}

function transformTextNode(node: MarkdownNode) {
  if (node.type !== "text" || !node.value) {
    return [node];
  }

  const replacements: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of node.value.matchAll(obsidianSyntaxPattern)) {
    const matchIndex = match.index ?? 0;
    const [raw, embedMarker, rawTarget, aliasOrWidth, tag] = match;

    if (matchIndex > cursor) {
      replacements.push({
        type: "text",
        value: node.value.slice(cursor, matchIndex),
      });
    }

    if (tag) {
      replacements.push({
        type: "obsidianTag",
        children: [{ type: "text", value: tag }],
        data: { hName: "data" },
      });
    } else if (embedMarker) {
      const target = rawTarget.trim();
      const width = Number.parseInt(aliasOrWidth ?? "", 10);
      replacements.push({
        type: "image",
        url: imageUrl(target),
        alt: imageAlt(target),
        ...(Number.isFinite(width) ? { data: { hProperties: { width } } } : {}),
      });
    } else {
      const target = rawTarget.trim();
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

function transformObsidianSyntax(node: MarkdownNode) {
  if (node.type === "obsidianTag" || !node.children) {
    return;
  }

  node.children = node.children.flatMap((child) => transformTextNode(child));

  for (const child of node.children) {
    transformObsidianSyntax(child);
  }
}

export function remarkObsidianSyntax() {
  return (tree: unknown) => {
    transformObsidianSyntax(tree as MarkdownNode);
  };
}
