import ReactMarkdown, { type Components } from "react-markdown";
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
  return (
    <div className="font-mono [&>p:first-child]:font-bold [&>p:not(:first-child)]:text-muted-foreground">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkObsidianSyntax]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
