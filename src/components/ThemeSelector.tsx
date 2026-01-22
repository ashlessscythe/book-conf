"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const THEMES = ["dark", "crimson", "mint", "seafoam", "cyberpunk", "neon"] as const;

type Theme = (typeof THEMES)[number];

export default function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.includes(stored as Theme)) {
      setTheme(stored as Theme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...THEMES);
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <label className="stack">
      <span className="muted">Theme</span>
      <select
        className="button secondary"
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
      >
        {THEMES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
