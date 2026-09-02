"use client";
import { BlueNoiseFluid } from "react-floyd-steinberg";
import { cn } from "@/lib/utils";

export function DitheredFluid({ className }: { className?: string }) {
  return (
    <BlueNoiseFluid
      pixelScale={2}
      patternSize={256}
      className={cn("size-full", className)}
      quantity="temperature"
      contrast={1}
      //light={"oklch(66.288% 0.2272 35.958)"}
      //light={"oklch(0.216 0.006 56.043)"}
      light={"oklch(0.268 0.007 34.298)"}
      //light={"oklch(0.709 0.01 56.259)"}
      dark={"oklch(0.147 0.004 49.25)"}
    />
  );
}
