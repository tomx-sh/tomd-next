import { isValidElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { MarkdownCodeBlock } from "@/components/markdown-code-block";
import { StyledLink } from "@/components/styled-link";
import { remarkObsidianSyntax } from "@/lib/remark-obsidian";

const components = {
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

type MarkdownHomeProps = {
  children: string;
};

export function MarkdownHome({ children }: MarkdownHomeProps) {
  // [&>p:not(:first-child)]:text-muted-foreground
  return (
    <div className="font-mono [&>p:first-child]:font-bold">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkBreaks, remarkObsidianSyntax]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
