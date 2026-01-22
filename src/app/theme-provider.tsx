"use client";

import { useEffect } from "react";

const STORAGE_KEY = "theme";
const DEFAULT_THEME = "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const theme = stored || DEFAULT_THEME;
    const root = document.documentElement;
    root.classList.remove(
      "dark",
      "crimson",
      "mint",
      "seafoam",
      "cyberpunk",
      "neon",
    );
    root.classList.add(theme);
  }, []);

  return children;
}
