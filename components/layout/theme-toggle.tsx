"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Switches the site between its dark baseline and the bright theme.
 *
 * The choice is applied to `<html>` before first paint by a pre-paint script in
 * app/layout.tsx, so this button only needs to flip it again and persist the
 * result. The icon follows the stored preference via the theme store, which is
 * SSR-safe (the server always reports the dark baseline).
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        "grid size-10 place-items-center rounded-full border border-hairline bg-tint/[0.04] text-mist-200 transition-colors duration-200 hover:bg-tint/[0.09] hover:text-mist-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-300" +
        (className ? ` ${className}` : "")
      }
    >
      {isDark ? (
        <Sun className="size-[17px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[17px]" aria-hidden="true" />
      )}
    </button>
  );
}