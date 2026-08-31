import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type StyledLinkProps = ComponentProps<typeof Link>;

export function StyledLink({ className, ...props }: StyledLinkProps) {
  return (
    <Link
      className={cn(
        "not-typeset relative top-0 text-primary underline-offset-4 transition-[top] outline-none hover:underline active:top-px focus-visible:ring-1 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}
