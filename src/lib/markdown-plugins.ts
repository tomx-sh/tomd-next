import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import { remarkObsidianSyntax } from "@/lib/remark-obsidian";
import { remarkObsidianCallouts } from "@/lib/remark-obsidian-callouts";

export const markdownPlugins: PluggableList = [
  remarkGfm,
  remarkObsidianCallouts,
  remarkBreaks,
  remarkObsidianSyntax,
];
