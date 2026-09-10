import { useEffect, useState } from "react";

const STORAGE_KEY = "jobneed:dark-mode";

function readInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function useDarkMode() {
  const [dark, setDark] = useState(readInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE_KEY, String(dark));
    } catch {
      // private mode / quota — toggling still works for this session
    }
  }, [dark]);

  return { dark, toggleDark: () => setDark((d) => !d) };
}
