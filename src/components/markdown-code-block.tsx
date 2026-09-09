"use client";

import type { BundledLanguage } from "shiki";
import { bundledLanguages } from "shiki";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
} from "@/components/kibo-ui/code-block";

const FALLBACK_LANGUAGE = "text";

// Shiki spells some common languages differently than the info strings
// Obsidian authors write in code fences.
const languageAliases: Record<string, string> = {
  "c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
};

function resolveLanguage(language: string | undefined): {
  language: string;
  syntaxHighlighting: boolean;
} {
  if (!language) {
    return { language: FALLBACK_LANGUAGE, syntaxHighlighting: false };
  }

  const normalized =
    languageAliases[language.trim().toLowerCase()] ??
    language.trim().toLowerCase();

  if (Object.hasOwn(bundledLanguages, normalized)) {
    return { language: normalized, syntaxHighlighting: true };
  }

  return { language: FALLBACK_LANGUAGE, syntaxHighlighting: false };
}

type MarkdownCodeBlockProps = {
  code: string;
  language?: string;
};

export function MarkdownCodeBlock({ code, language }: MarkdownCodeBlockProps) {
  const { language: resolved, syntaxHighlighting } = resolveLanguage(language);
  const data = [{ language: resolved, filename: resolved, code }];

  return (
    <CodeBlock className="not-typeset" data={data} defaultValue={resolved}>
      <CodeBlockHeader className="justify-between">
        <CodeBlockFiles>
          {(item) => (
            <CodeBlockFilename key={item.language} value={item.language}>
              {item.filename}
            </CodeBlockFilename>
          )}
        </CodeBlockFiles>
        <CodeBlockCopyButton />
      </CodeBlockHeader>
      <CodeBlockBody>
        {(item) => (
          <CodeBlockItem key={item.language} value={item.language}>
            <CodeBlockContent
              language={
                syntaxHighlighting ? (resolved as BundledLanguage) : undefined
              }
              syntaxHighlighting={syntaxHighlighting}
            >
              {item.code}
            </CodeBlockContent>
          </CodeBlockItem>
        )}
      </CodeBlockBody>
    </CodeBlock>
  );
}
