import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

type MiniIconProps = Omit<ComponentProps<"span">, "children"> & {
  name: string;
  size?: number;
};

export function MiniIcon({
  name,
  size = 16,
  className,
  style,
  ...props
}: MiniIconProps) {
  const mask = `url("/icons/pixelarticons-mini/${name}.svg") center / contain no-repeat`;

  return (
    <span
      aria-hidden="true"
      data-slot="mini-icon"
      className={cn("inline-block shrink-0 bg-current", className)}
      style={
        {
          width: size,
          height: size,
          mask,
          WebkitMask: mask,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
