import "server-only";

import { DirectedGraph } from "graphology";
import type {
  ArticleGraphData,
  ArticleGraphEdge,
  ArticleGraphNode,
} from "@/components/article-graph";

type ArticleSource = {
  slug: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

function contentOutsideCodeFences(content: string) {
  let fence: "```" | "~~~" | null = null;

  return content
    .split("\n")
    .map((line) => {
      const marker = line.trimStart().slice(0, 3);

      if (marker === "```" || marker === "~~~") {
        if (!fence || fence === marker) {
          fence = fence === marker ? null : marker;
        }
        return "";
      }

      return fence ? "" : line.replaceAll(/`[^`]*`/g, "");
    })
    .join("\n");
}

function normalizeTag(tag: string) {
  return tag.trim().replace(/^#/, "").toLocaleLowerCase();
}

function frontmatterTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }

  if (typeof value === "string") {
    return value.split(/[#,\s]+/);
  }

  return [];
}

export function getArticleTags(
  content: string,
  frontmatter: Record<string, unknown>,
) {
  const tags = new Set(
    frontmatterTags(frontmatter.tags ?? frontmatter.tag)
      .map(normalizeTag)
      .filter(Boolean),
  );
  const visibleContent = contentOutsideCodeFences(content);

  for (const match of visibleContent.matchAll(
    /(?:^|\s)#([\p{L}\p{N}][\p{L}\p{N}_/-]*)\b/gu,
  )) {
    tags.add(normalizeTag(match[1]));
  }

  return [...tags];
}

function normalizePageReference(reference: string) {
  let normalized = reference.trim().split("#", 1)[0].replaceAll("\\", "/");

  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep malformed URI text as-is so one bad link cannot break the index.
  }

  normalized = normalized.split("/").at(-1) ?? normalized;

  return normalized
    .replace(/\.md$/i, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function getLinkedPageReferences(content: string) {
  const visibleContent = contentOutsideCodeFences(content);
  const references = new Set<string>();

  for (const match of visibleContent.matchAll(
    /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g,
  )) {
    references.add(normalizePageReference(match[1]));
  }

  for (const match of visibleContent.matchAll(
    /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g,
  )) {
    const href = match[1];
    const articlePath = href.match(/(?:^|\/)articles\/([^/?#]+)/)?.[1];

    if (articlePath) {
      references.add(normalizePageReference(articlePath));
    } else if (/^(?:\.\.?\/)?[^:?#]+\.md(?:#.*)?$/i.test(href)) {
      references.add(normalizePageReference(href));
    }
  }

  return references;
}

export function buildArticleGraph(articles: ArticleSource[]): ArticleGraphData {
  const articleList = articles;
  const graph = new DirectedGraph<ArticleGraphNode, ArticleGraphEdge>();
  const pageByReference = new Map<string, string>();

  for (const article of articleList) {
    const node: ArticleGraphNode = {
      id: article.slug,
      slug: article.slug,
      title: article.title,
      tags: getArticleTags(article.content, article.frontmatter),
      contentLength: article.content.trim().length,
    };

    graph.addNode(article.slug, node);
    pageByReference.set(normalizePageReference(article.slug), article.slug);
    pageByReference.set(normalizePageReference(article.title), article.slug);
  }

  for (const article of articleList) {
    for (const reference of getLinkedPageReferences(article.content)) {
      const target = pageByReference.get(reference);

      if (target && target !== article.slug) {
        graph.mergeDirectedEdge(article.slug, target, { kind: "page-link" });
      }
    }
  }

  const nodes: ArticleGraphNode[] = [];
  const edges: ArticleGraphData["edges"] = [];

  graph.forEachNode((_node, attributes) => nodes.push(attributes));
  graph.forEachDirectedEdge((edge, attributes, source, target) => {
    edges.push({ id: edge, source, target, ...attributes });
  });

  return { nodes, edges };
}
