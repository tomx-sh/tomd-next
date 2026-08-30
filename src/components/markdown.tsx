import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { remarkObsidianSyntax } from "@/lib/remark-obsidian";

const components = {
  data: ({ children }) => (
    <Badge className="rounded-full font-mono">{children}</Badge>
  ),
} satisfies Components;

type MarkdownProps = {
  children: string;
};

export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkGfm, remarkObsidianSyntax]}
    >
      {children}
    </ReactMarkdown>
  );
}
