export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'finances.theme';

/** Default explícito: light (não segue prefers-color-scheme no MVP). */
export const DEFAULT_THEME: ThemeMode = 'light';

export function readStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function persistTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme);
}
