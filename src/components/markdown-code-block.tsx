"use client";

import { type ComponentProps, isValidElement } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";

type MarkdownCodeBlockProps = {
  code: string;
  language?: string;
};

function MarkdownCodeBlock({
  code,
  language = "text",
}: MarkdownCodeBlockProps) {
  const lines = useHighlightedCode(code, language);

  return (
    <CodeBlock className="not-typeset">
      <CodeBlockHeader>
        <CodeBlockTitle>{language}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        {lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Code lines have a fixed order and may repeat.
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}

// Block code is identified by its pre wrapper, so fences without a language
// get the same controls while inline code remains a normal code element.
export function MarkdownPre({ children, ...props }: ComponentProps<"pre">) {
  if (isValidElement<ComponentProps<"code">>(children)) {
    const { children: source, className } = children.props;
    if (typeof source === "string") {
      const language = /language-([\w.+#-]+)/.exec(className ?? "")?.[1];
      return (
        <MarkdownCodeBlock
          code={source.replace(/\n$/, "")}
          language={language}
        />
      );
    }
  }

  return <pre {...props}>{children}</pre>;
}
