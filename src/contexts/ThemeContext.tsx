import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_THEME, Theme, hexToHslString, adjustHexBrightness } from '@/constants/theme';

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
  const [mode, setModeState] = useState<Mode>(
    () => (localStorage.getItem(storageKey) as Mode) || defaultTheme
  );

  const [colorTheme, setColorThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(colorStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to DEFAULT_THEME if parse fails
      }
    }
    return DEFAULT_THEME;
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

  // Handle Color Theme & CSS Variables
  useEffect(() => {
    const root = window.document.documentElement;

    root.style.setProperty('--theme-primary', colorTheme.primary);
    root.style.setProperty('--theme-secondary', colorTheme.secondary);
    
    // Inject HSL formatted brand primary CSS variables for Tailwind
    const brandHsl = hexToHslString(colorTheme.primary);
    const brandHoverHex = colorTheme.secondary || adjustHexBrightness(colorTheme.primary, -15);
    const brandHoverHsl = hexToHslString(brandHoverHex);

    root.style.setProperty('--brand-primary', brandHsl);
    root.style.setProperty('--brand-primary-hover', brandHoverHsl);
  }, [colorTheme]);

  const setMode = (newMode: Mode) => {
    localStorage.setItem(storageKey, newMode);
    setModeState(newMode);
  };

  const setColorTheme = (newColorTheme: Theme) => {
    localStorage.setItem(colorStorageKey, JSON.stringify(newColorTheme));
    setColorThemeState(newColorTheme);
  };

  const resetColorTheme = () => {
    localStorage.removeItem(colorStorageKey);
    setColorThemeState(DEFAULT_THEME);
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