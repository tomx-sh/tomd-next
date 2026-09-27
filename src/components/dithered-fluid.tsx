"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BlueNoiseFluid } from "react-floyd-steinberg";
import { cn } from "@/lib/utils";

const LIGHT_COLOR = {
  FOR_LIGHT_MODE: "oklch(0.8 0.005 56.366)",
  FOR_DARK_MODE: "--chart-3",
  // FOR_LIGHT_MODE: "--foreground",
  // FOR_DARK_MODE: "--foreground",
};

const resolveColor = (styles: CSSStyleDeclaration, value: string) =>
  value.startsWith("--") ? styles.getPropertyValue(value).trim() : value;

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
        dark: resolveColor(styles, "--background"),
        light: resolveColor(styles, lightColor),
      });
    };

    syncColors();

    const observer = new MutationObserver(syncColors);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [resolvedTheme]);

  return (
    <BlueNoiseFluid
      pixelScale={2}
      patternSize={256}
      className={cn("size-full", className)}
      quantity="temperature"
      contrast={1.08}
      viscosity={10}
      light={colors.light}
      dark={colors.dark}
    />
  );
}
