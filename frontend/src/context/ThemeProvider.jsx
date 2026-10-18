import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";

function initialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
  } catch {
    // storage unavailable, fall through to the default
  }
  return true; // dark is the default
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [dark]);

  const toggle = useCallback(() => setDark((value) => !value), []);
  const value = useMemo(() => ({ dark, toggle }), [dark, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
