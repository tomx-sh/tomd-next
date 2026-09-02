"use client";
import { useEffect, useState } from "react";
import { BlueNoiseFluid } from "react-floyd-steinberg";
import { cn } from "@/lib/utils";

export function DitheredFluid({ className }: { className?: string }) {
  const [colors, setColors] = useState({
    light: "oklch(0.967 0.001 286.375)",
    dark: "oklch(1 0 0)",
  });

  useEffect(() => {
    const root = document.documentElement;

    const syncColors = () => {
      const styles = getComputedStyle(root);
      setColors({
        light: styles.getPropertyValue("--foreground").trim(),
        dark: styles.getPropertyValue("--background").trim(),
      });
    };

    syncColors();

    const observer = new MutationObserver(syncColors);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <BlueNoiseFluid
      pixelScale={2}
      patternSize={256}
      className={cn("size-full", className)}
      quantity="temperature"
      contrast={1}
      light={colors.light}
      dark={colors.dark}
    />
  );
}
