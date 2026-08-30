import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { remarkObsidianSyntax } from "@/lib/remark-obsidian";

const components = {
  a: ({ children, href, title }) => {
    if (!href) {
      return children;
    }

    return (
      <Link href={href} title={title}>
        {children}
      </Link>
    );
  },
  data: ({ children }) => (
    <Badge variant="secondary" className="not-typeset rounded-full font-mono">
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
} satisfies Components;

type MarkdownProps = {
  children: string;
};

export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="typeset typeset-article max-w-[42em]">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm, remarkObsidianSyntax]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
