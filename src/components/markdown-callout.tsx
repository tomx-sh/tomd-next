"use client";

import {
  AlertTriangleIcon,
  BugIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  FlameIcon,
  InfoIcon,
  ListIcon,
  PencilIcon,
  QuoteIcon,
  TextIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const calloutTypes = {
  note: PencilIcon,
  abstract: ListIcon,
  info: InfoIcon,
  todo: CircleCheckIcon,
  tip: FlameIcon,
  success: CheckIcon,
  question: CircleHelpIcon,
  warning: AlertTriangleIcon,
  failure: XIcon,
  danger: ZapIcon,
  bug: BugIcon,
  example: TextIcon,
  quote: QuoteIcon,
};

type CalloutType = keyof typeof calloutTypes;

const aliases: Record<string, CalloutType> = {
  summary: "abstract",
  tldr: "abstract",
  hint: "tip",
  important: "tip",
  check: "success",
  done: "success",
  help: "question",
  faq: "question",
  caution: "warning",
  attention: "warning",
  fail: "failure",
  missing: "failure",
  error: "danger",
  cite: "quote",
};

type MarkdownCalloutProps = {
  type: string;
  fold: string;
  title: ReactNode;
  children: ReactNode;
};

export function MarkdownCallout({
  type,
  fold,
  title,
  children,
}: MarkdownCalloutProps) {
  const resolved = Object.hasOwn(aliases, type) ? aliases[type] : type;
  const canonical: CalloutType = Object.hasOwn(calloutTypes, resolved)
    ? (resolved as CalloutType)
    : "note";
  const Icon = calloutTypes[canonical];
  const foldable = fold === "+" || fold === "-";
  const description = children ? (
    <AlertDescription className="text-[1em] leading-[inherit]">
      <div className="[&>:first-child]:mt-0">{children}</div>
    </AlertDescription>
  ) : null;

  const alert = (
    <Alert
      role="note"
      className="text-[1em] leading-[inherit]"
      variant={
        canonical === "failure" || canonical === "danger" || canonical === "bug"
          ? "destructive"
          : "default"
      }
    >
      <Icon aria-hidden="true" className="size-[1em]" />
      <AlertTitle data-not-typeset>{title}</AlertTitle>
      {foldable ? (
        <>
          <AlertAction data-not-typeset>
            <CollapsibleTrigger
              aria-label={`Toggle ${type} callout`}
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <ChevronsUpDownIcon aria-hidden="true" />
            </CollapsibleTrigger>
          </AlertAction>
          <div className="col-start-2 min-w-0">
            <CollapsibleContent hiddenUntilFound>
              {description}
            </CollapsibleContent>
          </div>
        </>
      ) : (
        description
      )}
    </Alert>
  );

  return (
    <div className="my-5 first:mt-0" data-callout={canonical}>
      {foldable ? (
        <Collapsible defaultOpen={fold === "+"}>{alert}</Collapsible>
      ) : (
        alert
      )}
    </div>
  );
}
