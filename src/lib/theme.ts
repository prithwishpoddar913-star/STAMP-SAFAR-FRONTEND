export type ThemeMode = "light" | "dark";

const THEME_KEY = "stampSafar.theme";

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const value = window.localStorage.getItem(THEME_KEY);
  return value === "dark" ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function saveTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}
