import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactNode,
} from "react";
import type { ExtraProps } from "react-markdown";
import { MarkdownCallout } from "@/components/markdown-callout";

export function MarkdownBlockquote({
  children,
  node,
  ...props
}: ComponentProps<"blockquote"> & ExtraProps) {
  const type = node?.properties["data-callout"];
  if (typeof type !== "string") {
    return <blockquote {...props}>{children}</blockquote>;
  }

  const [heading, ...body] = Children.toArray(children).filter(
    (child) => typeof child !== "string" || child.trim(),
  );
  const title = isValidElement<{ children?: ReactNode }>(heading)
    ? heading.props.children
    : heading;

  return (
    <MarkdownCallout
      type={type}
      fold={String(node?.properties["data-callout-fold"] ?? "")}
      title={title}
    >
      {body.length ? body : null}
    </MarkdownCallout>
  );
}
