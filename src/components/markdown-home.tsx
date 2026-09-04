import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
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
