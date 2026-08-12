import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_THEME, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME, Theme, hexToHslString, adjustHexBrightness } from '@/constants/theme';

export type Mode = 'dark' | 'light' | 'system';

interface ThemeProviderContextType {
  theme: Mode; // Backwards compatible alias for mode
  mode: Mode;
  setTheme: (mode: Mode) => void;
  setMode: (mode: Mode) => void;
  colorTheme: Theme;
  setColorTheme: (theme: Theme) => void;
  resetColorTheme: () => void;
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Mode;
  storageKey?: string;
  colorStorageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  colorStorageKey = 'study-app-color-theme',
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<Mode>(() => {
    try {
      return (localStorage.getItem(storageKey) as Mode) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [colorTheme, setColorThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(colorStorageKey);
      if (saved) {
        return JSON.parse(saved);
      }
      const savedMode = localStorage.getItem(storageKey);
      if (savedMode === 'light' || (!savedMode && defaultTheme === 'light')) return DEFAULT_LIGHT_THEME;
    } catch (e) {
      // Fallback
    }
    return DEFAULT_DARK_THEME;
  });

  // Handle Mode (Light/Dark/System)
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(mode);
  }, [mode]);

  // Handle Color Theme & Full-Platform CSS Variables
  useEffect(() => {
    const root = window.document.documentElement;

    // Apply base mode if theme defines it
    if (colorTheme.mode) {
      root.classList.remove('light', 'dark');
      root.classList.add(colorTheme.mode);
    }

    root.style.setProperty('--theme-primary', colorTheme.primary);
    root.style.setProperty('--theme-secondary', colorTheme.secondary);

    // Inject HSL formatted brand primary CSS variables for Tailwind
    const brandHsl = hexToHslString(colorTheme.primary);
    const brandHoverHex = colorTheme.secondary || adjustHexBrightness(colorTheme.primary, -15);
    const brandHoverHsl = hexToHslString(brandHoverHex);

    root.style.setProperty('--brand-primary', brandHsl);
    root.style.setProperty('--brand-primary-hover', brandHoverHsl);

    // Inject full platform surface & structure CSS variables
    if (colorTheme.background) root.style.setProperty('--background', colorTheme.background);
    if (colorTheme.foreground) root.style.setProperty('--foreground', colorTheme.foreground);
    if (colorTheme.card) root.style.setProperty('--card', colorTheme.card);
    if (colorTheme.cardForeground) root.style.setProperty('--card-foreground', colorTheme.cardForeground);
    if (colorTheme.popover) root.style.setProperty('--popover', colorTheme.popover);
    if (colorTheme.popoverForeground) root.style.setProperty('--popover-foreground', colorTheme.popoverForeground);
    if (colorTheme.border) root.style.setProperty('--border', colorTheme.border);
    if (colorTheme.input) root.style.setProperty('--input', colorTheme.input);
    if (colorTheme.ring) root.style.setProperty('--ring', colorTheme.ring);
    // Sidebar defaults to card surface and border tokens for full platform visual consistency
    root.style.setProperty('--sidebar-background', colorTheme.sidebarBackground || colorTheme.card || '217 33% 15%');
    root.style.setProperty('--sidebar-foreground', colorTheme.sidebarForeground || colorTheme.cardForeground || colorTheme.foreground || '210 40% 98%');
    root.style.setProperty('--sidebar-border', colorTheme.sidebarBorder || colorTheme.border || '217 33% 25%');
  }, [colorTheme]);

  const setMode = (newMode: Mode) => {
    try {
      localStorage.setItem(storageKey, newMode);
    } catch {}
    setModeState(newMode);
    if (newMode === 'light') {
      setColorThemeState(DEFAULT_LIGHT_THEME);
      try {
        localStorage.setItem(colorStorageKey, JSON.stringify(DEFAULT_LIGHT_THEME));
      } catch {}
    } else if (newMode === 'dark' && (colorTheme.id === 'default-light' || colorTheme.id === 'default-dark')) {
      setColorThemeState(DEFAULT_DARK_THEME);
      try {
        localStorage.setItem(colorStorageKey, JSON.stringify(DEFAULT_DARK_THEME));
      } catch {}
    }
  };

  const setColorTheme = (newColorTheme: Theme) => {
    try {
      localStorage.setItem(colorStorageKey, JSON.stringify(newColorTheme));
    } catch {}
    if (newColorTheme.mode) {
      try {
        localStorage.setItem(storageKey, newColorTheme.mode);
      } catch {}
      setModeState(newColorTheme.mode);
    }
    setColorThemeState(newColorTheme);
  };

  const resetColorTheme = () => {
    try {
      localStorage.removeItem(colorStorageKey);
      localStorage.setItem(storageKey, DEFAULT_DARK_THEME.mode || 'dark');
    } catch {}
    setModeState(DEFAULT_DARK_THEME.mode || 'dark');
    setColorThemeState(DEFAULT_DARK_THEME);
  };

  const value: ThemeProviderContextType = {
    theme: mode,
    mode,
    setTheme: setMode,
    setMode,
    colorTheme,
    setColorTheme,
    resetColorTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}