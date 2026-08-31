"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { MiniIcon } from "@/components/mini-icon";
import { Toggle } from "@/components/ui/toggle";

const SYSTEM_DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

export function SystemThemeToggle() {
  const { setTheme, theme } = useTheme();
  const isInverted = theme === "light" || theme === "dark";

  useEffect(() => {
    if (!isInverted) {
      return;
    }

    const systemTheme = window.matchMedia(SYSTEM_DARK_THEME_QUERY);
    const applyInvertedTheme = (prefersDark: boolean) => {
      setTheme(prefersDark ? "light" : "dark");
    };
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      applyInvertedTheme(event.matches);
    };

    applyInvertedTheme(systemTheme.matches);
    systemTheme.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemTheme.removeEventListener("change", handleSystemThemeChange);
    };
  }, [isInverted, setTheme]);

  const handlePressedChange = (pressed: boolean) => {
    if (!pressed) {
      setTheme("system");
      return;
    }

    const systemPrefersDark = window.matchMedia(
      SYSTEM_DARK_THEME_QUERY,
    ).matches;
    setTheme(systemPrefersDark ? "light" : "dark");
  };

  return (
    <Toggle
      pressed={isInverted}
      onPressedChange={handlePressedChange}
      size="sm"
      aria-label={isInverted ? "Use system theme" : "Invert system theme"}
      title={isInverted ? "Use system theme" : "Invert system theme"}
    >
      <MiniIcon name="sun" className="dark:hidden" />
      <MiniIcon name="moon" className="hidden dark:inline-block" />
    </Toggle>
  );
}
