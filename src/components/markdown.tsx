import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { remarkObsidianSyntax } from "@/lib/remark-obsidian";
import { cn } from "@/lib/utils";

const blockSpacingClassName = "mt-6 first:mt-0";
const bodyTextClassName = "text-base leading-6 text-foreground/80";
const headingClassName =
  "mt-6 first:mt-0 font-[650] leading-[1.2] tracking-[-0.025em]";

const components = {
  a: ({ children, href, title }) => {
    if (!href) {
      return children;
    }

    return (
      <Link
        className={cn(
          buttonVariants({ size: null, variant: "link" }),
          "inline h-auto whitespace-normal p-0 align-baseline font-[inherit] text-[length:inherit]",
        )}
        href={href}
        title={title}
      >
        {children}
      </Link>
    );
  },
  blockquote: ({ children }) => (
    <blockquote
      className={`${blockSpacingClassName} border-foreground/25 border-l-[0.2rem] pl-4 [&>p]:text-muted-foreground`}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-foreground/8 px-[0.35em] py-[0.15em] font-mono text-[0.9em]">
      {children}
    </code>
  ),
  data: ({ children }) => (
    <Badge variant="secondary" className="rounded-full font-mono">
      {children}
    </Badge>
  ),
  h1: ({ children }) => (
    <h1 className={`${headingClassName} text-4xl`}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className={`${headingClassName} text-[1.75rem]`}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className={`${headingClassName} text-[1.35rem]`}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className={`${headingClassName} text-lg`}>{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className={`${headingClassName} text-base`}>{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className={`${headingClassName} text-sm`}>{children}</h6>
  ),
  img: ({ alt, height, src, title, width }) => (
    // Markdown images do not always provide dimensions, so a native image keeps
    // their intrinsic sizing while respecting Obsidian's optional width alias.
    // biome-ignore lint/performance/noImgElement: Markdown images can omit dimensions.
    <img
      alt={alt ?? ""}
      className="h-auto max-w-full"
      height={height}
      src={src}
      title={title}
      width={width}
    />
  ),
  ol: ({ children }) => (
    <ol
      className={`${blockSpacingClassName} ${bodyTextClassName} list-decimal pl-6`}
    >
      {children}
    </ol>
  ),
  p: ({ children }) => (
    <p className={`${blockSpacingClassName} ${bodyTextClassName}`}>
      {children}
    </p>
  ),
  pre: ({ children }) => (
    <pre
      className={`${blockSpacingClassName} overflow-x-auto rounded-lg bg-foreground/8 p-4 leading-[1.6] [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-sm`}
    >
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <table
      className={`${blockSpacingClassName} ${bodyTextClassName} block w-full border-collapse overflow-x-auto`}
    >
      {children}
    </table>
  ),
  td: ({ children }) => (
    <td className="border border-foreground/20 px-3 py-2 text-left">
      {children}
    </td>
  ),
  th: ({ children }) => (
    <th className="border border-foreground/20 bg-foreground/6 px-3 py-2 text-left font-[650]">
      {children}
    </th>
  ),
  ul: ({ children }) => (
    <ul
      className={`${blockSpacingClassName} ${bodyTextClassName} list-disc pl-6`}
    >
      {children}
    </ul>
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
