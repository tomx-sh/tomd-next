"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BlueNoiseFluid } from "react-floyd-steinberg";
import { cn } from "@/lib/utils";

const LIGHT_COLOR = {
  FOR_LIGHT_MODE: "--chart-4",
  FOR_DARK_MODE: "--chart-2",
};

export function DitheredFluid({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    light: "oklch(0.967 0.001 286.375)",
    dark: "oklch(1 0 0)",
  });

  useEffect(() => {
    const root = document.documentElement;
    const lightColor =
      resolvedTheme === "light"
        ? LIGHT_COLOR.FOR_LIGHT_MODE
        : LIGHT_COLOR.FOR_DARK_MODE;

    const syncColors = () => {
      const styles = getComputedStyle(root);
      setColors({
        dark: styles.getPropertyValue("--card").trim(),
        light: styles.getPropertyValue(lightColor).trim(),
      });
    };

    syncColors();

    const observer = new MutationObserver(syncColors);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [resolvedTheme]);

  return (
    <BlueNoiseFluid
      pixelScale={1}
      patternSize={256}
      className={cn("size-full border-t", className)}
      quantity="temperature"
      contrast={1.1}
      light={colors.light}
      dark={colors.dark}
    />
  );
}
