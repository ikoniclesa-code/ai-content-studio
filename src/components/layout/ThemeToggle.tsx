"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <span
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-secondary)] ${className}`}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${className}`}
      aria-label={theme === "light" ? "Uključi tamnu temu" : "Uključi svetlu temu"}
    >
      {theme === "light" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
    </button>
  );
}
