import ReactMarkdown, { type Components } from "react-markdown";
import { MarkdownBlockquote } from "@/components/markdown-blockquote";
import { MarkdownPre } from "@/components/markdown-code-block";
import { StyledLink } from "@/components/styled-link";
import { markdownPlugins } from "@/lib/markdown-plugins";

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
  pre: MarkdownPre,
} satisfies Components;

type MarkdownHomeProps = {
  children: string;
};

export function MarkdownHome({ children }: MarkdownHomeProps) {
  // [&>p:not(:first-child)]:text-muted-foreground
  //  [&>p:first-child]:font-bold
  return (
    <div className="font-mono font-medium">
      <ReactMarkdown components={components} remarkPlugins={markdownPlugins}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
