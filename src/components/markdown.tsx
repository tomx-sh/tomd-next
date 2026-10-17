import { isValidElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { MarkdownBlockquote } from "@/components/markdown-blockquote";
import { MarkdownCodeBlock } from "@/components/markdown-code-block";
import { StyledLink } from "@/components/styled-link";
import { Badge } from "@/components/ui/badge";
import { remarkObsidianSyntax } from "@/lib/remark-obsidian";
import { remarkObsidianCallouts } from "@/lib/remark-obsidian-callouts";
import { cn } from "@/lib/utils";

const components = {
  blockquote: MarkdownBlockquote,
  a: ({ children, href, title }) => {
    if (!href) {
      return children;
    }

    return (
      <StyledLink href={href} title={title}>
        {children}
      </StyledLink>
    );
  },
  data: ({ children }) => (
    <Badge variant="secondary" className="not-typeset font-mono">
      {children}
    </Badge>
  ),
  img: ({ alt, height, src, title, width }) => (
    // Markdown images do not always provide dimensions, so a native image keeps
    // their intrinsic sizing while respecting Obsidian's optional width alias.
    // biome-ignore lint/performance/noImgElement: Markdown images can omit dimensions.
    <img
      alt={alt ?? ""}
      height={height}
      src={src}
      title={title}
      width={width}
    />
  ),
  table: ({ children }) => (
    <div className="typeset-scroll">
      <table>{children}</table>
    </div>
  ),
  code: ({ children, className }) => {
    const match = /language-([\w.+#-]+)/.exec(className ?? "");

    if (match) {
      const source = (
        Array.isArray(children) ? children.join("") : String(children)
      ).replace(/\n$/, "");

      return <MarkdownCodeBlock code={source} language={match[1]} />;
    }

    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => {
    // Fenced code blocks render our MarkdownCodeBlock as a <div>, so drop the
    // default <pre> wrapper that would otherwise style it twice.
    if (
      isValidElement(children) &&
      typeof (children.props as { className?: unknown }).className ===
        "string" &&
      /language-[\w.+#-]+/.test(
        (children.props as { className?: unknown }).className as string,
      )
    ) {
      return children;
    }

    return <pre>{children}</pre>;
  },
} satisfies Components;

const cvComponents = {
  ...components,
  h2: ({ children }) => (
    <h2>
      <span>{children}</span>
    </h2>
  ),
} satisfies Components;

type MarkdownProps = {
  children: string;
  variant?: "article" | "cv";
};

export function Markdown({ children, variant = "article" }: MarkdownProps) {
  return (
    <div
      className={cn(
        "typeset typeset-article max-w-[42em]",
        variant === "cv" && "typeset-cv",
      )}
    >
      <ReactMarkdown
        components={variant === "cv" ? cvComponents : components}
        remarkPlugins={[
          remarkGfm,
          remarkObsidianCallouts,
          remarkBreaks,
          remarkObsidianSyntax,
        ]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
