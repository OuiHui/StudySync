export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  gradient: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebarBackground?: string;
  sidebarForeground?: string;
  sidebarBorder?: string;
}

export const BRAND_PRIMARY = '#2a78d6';
export const BRAND_PRIMARY_HOVER = '#2268bc';
export const BRAND_BUTTON_CLASS = 'bg-brand hover:bg-brand-hover text-white';
export const BRAND_TEXT_CLASS = 'text-brand';
export const BRAND_BORDER_CLASS = 'border-brand';
export const PAGE_TITLE_CLASS = 'text-3xl font-bold text-gray-800 dark:text-white';

export const DEFAULT_LIGHT_THEME: Theme = {
  id: 'default-light',
  name: 'Default Light',
  mode: 'light',
  primary: '#2a78d6',
  secondary: '#2268bc',
  gradient: 'from-blue-50/80 via-indigo-50/40 to-slate-100',
  background: '210 40% 98%',
  foreground: '222.2 84% 4.9%',
  card: '0 0% 100%',
  cardForeground: '222.2 84% 4.9%',
  popover: '0 0% 100%',
  popoverForeground: '222.2 84% 4.9%',
  border: '214.3 31.8% 88%',
  input: '214.3 31.8% 88%',
  ring: '213 67% 50%',
  sidebarBackground: '0 0% 98%',
  sidebarForeground: '240 5.3% 26.1%',
  sidebarBorder: '220 13% 91%',
};

export const DEFAULT_DARK_THEME: Theme = {
  id: 'default-dark',
  name: 'Default Dark',
  mode: 'dark',
  primary: '#2a78d6',
  secondary: '#2268bc',
  gradient: 'from-slate-950 via-slate-900 to-indigo-950/40',
  background: '222.2 84% 5%',
  foreground: '210 40% 98%',
  card: '217 33% 15%',
  cardForeground: '210 40% 98%',
  popover: '217 33% 15%',
  popoverForeground: '210 40% 98%',
  border: '217 33% 25%',
  input: '217 33% 25%',
  ring: '213 67% 50%',
  sidebarBackground: '217 33% 15%',
  sidebarForeground: '210 40% 98%',
  sidebarBorder: '217 33% 25%',
};

export const DEFAULT_THEME: Theme = DEFAULT_DARK_THEME;

export const COLOR_THEMES: Theme[] = [
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    mode: 'dark',
    primary: '#1d4ed8',
    secondary: '#3b82f6',
    gradient: 'from-[#060d1d] via-[#0b162c] to-[#0369a1]/30',
    background: '224 71% 5%',
    foreground: '210 40% 98%',
    card: '222 47% 14%',
    cardForeground: '210 40% 98%',
    popover: '222 47% 14%',
    popoverForeground: '210 40% 98%',
    border: '221 45% 26%',
    input: '221 45% 26%',
    ring: '221 83% 53%',
    sidebarBackground: '222 47% 14%',
    sidebarForeground: '210 40% 98%',
    sidebarBorder: '221 45% 26%',
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    mode: 'dark',
    primary: '#059669',
    secondary: '#10b981',
    gradient: 'from-[#031812] via-[#05291e] to-[#047857]/30',
    background: '160 50% 4%',
    foreground: '150 30% 98%',
    card: '162 40% 13%',
    cardForeground: '150 30% 98%',
    popover: '162 40% 13%',
    popoverForeground: '150 30% 98%',
    border: '160 35% 24%',
    input: '160 35% 24%',
    ring: '160 84% 39%',
    sidebarBackground: '162 40% 13%',
    sidebarForeground: '150 30% 98%',
    sidebarBorder: '160 35% 24%',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    mode: 'dark',
    primary: '#7c3aed',
    secondary: '#a855f7',
    gradient: 'from-[#0e051a] via-[#170a2c] to-[#6d28d9]/30',
    background: '270 50% 5%',
    foreground: '270 30% 98%',
    card: '272 40% 15%',
    cardForeground: '270 30% 98%',
    popover: '272 40% 15%',
    popoverForeground: '270 30% 98%',
    border: '270 35% 26%',
    input: '270 35% 26%',
    ring: '263 70% 58%',
    sidebarBackground: '272 40% 15%',
    sidebarForeground: '270 30% 98%',
    sidebarBorder: '270 35% 26%',
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    mode: 'dark',
    primary: '#ea580c',
    secondary: '#f97316',
    gradient: 'from-[#190a04] via-[#261007] to-[#c2410c]/30',
    background: '20 50% 4%',
    foreground: '20 30% 98%',
    card: '20 40% 14%',
    cardForeground: '20 30% 98%',
    popover: '20 40% 14%',
    popoverForeground: '20 30% 98%',
    border: '20 35% 25%',
    input: '20 35% 25%',
    ring: '20 84% 48%',
    sidebarBackground: '20 40% 14%',
    sidebarForeground: '20 30% 98%',
    sidebarBorder: '20 35% 25%',
  },
  {
    id: 'rose-pink',
    name: 'Rose Pink',
    mode: 'dark',
    primary: '#e11d48',
    secondary: '#f43f5e',
    gradient: 'from-[#19050b] via-[#270814] to-[#be123c]/30',
    background: '345 50% 4%',
    foreground: '345 30% 98%',
    card: '345 40% 14%',
    cardForeground: '345 30% 98%',
    popover: '345 40% 14%',
    popoverForeground: '345 30% 98%',
    border: '345 35% 25%',
    input: '345 35% 25%',
    ring: '343 81% 50%',
    sidebarBackground: '345 40% 14%',
    sidebarForeground: '345 30% 98%',
    sidebarBorder: '345 35% 25%',
  },
  {
    id: 'teal-cyan',
    name: 'Teal Cyan',
    mode: 'dark',
    primary: '#0d9488',
    secondary: '#14b8a6',
    gradient: 'from-[#041618] via-[#072327] to-[#0f766e]/30',
    background: '180 50% 4%',
    foreground: '180 30% 98%',
    card: '180 40% 13%',
    cardForeground: '180 30% 98%',
    popover: '180 40% 13%',
    popoverForeground: '180 30% 98%',
    border: '180 35% 24%',
    input: '180 35% 24%',
    ring: '175 84% 32%',
    sidebarBackground: '180 40% 13%',
    sidebarForeground: '180 30% 98%',
    sidebarBorder: '180 35% 24%',
  },
  {
    id: 'crimson-red',
    name: 'Crimson Red',
    mode: 'dark',
    primary: '#dc2626',
    secondary: '#ef4444',
    gradient: 'from-[#1a0606] via-[#290a0a] to-[#b91c1c]/30',
    background: '0 50% 4%',
    foreground: '0 30% 98%',
    card: '0 40% 14%',
    cardForeground: '0 30% 98%',
    popover: '0 40% 14%',
    popoverForeground: '0 30% 98%',
    border: '0 35% 25%',
    input: '0 35% 25%',
    ring: '0 72% 51%',
    sidebarBackground: '0 40% 14%',
    sidebarForeground: '0 30% 98%',
    sidebarBorder: '0 35% 25%',
  },
  {
    id: 'slate-gray',
    name: 'Slate Gray',
    mode: 'dark',
    primary: '#475569',
    secondary: '#64748b',
    gradient: 'from-[#0b1120] via-[#162032] to-[#334155]/30',
    background: '222 47% 5%',
    foreground: '210 40% 98%',
    card: '215 28% 16%',
    cardForeground: '210 40% 98%',
    popover: '215 28% 16%',
    popoverForeground: '210 40% 98%',
    border: '215 25% 26%',
    input: '215 25% 26%',
    ring: '215 25% 35%',
    sidebarBackground: '215 28% 16%',
    sidebarForeground: '210 40% 98%',
    sidebarBorder: '215 25% 26%',
  },
  {
    id: 'amber-gold',
    name: 'Amber Gold',
    mode: 'dark',
    primary: '#d97706',
    secondary: '#f59e0b',
    gradient: 'from-[#190f03] via-[#261605] to-[#b45309]/30',
    background: '35 50% 4%',
    foreground: '35 30% 98%',
    card: '35 40% 14%',
    cardForeground: '35 30% 98%',
    popover: '35 40% 14%',
    popoverForeground: '35 30% 98%',
    border: '35 35% 25%',
    input: '35 35% 25%',
    ring: '38 92% 44%',
    sidebarBackground: '35 40% 14%',
    sidebarForeground: '35 30% 98%',
    sidebarBorder: '35 35% 25%',
  },
];

export const DEFAULT_PAGE_BACKGROUND = 'from-background to-muted dark:from-background dark:to-muted';
export const WORK_TIMER_BACKGROUND = 'from-blue-100 via-purple-50 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20';
export const BREAK_TIMER_BACKGROUND = 'from-green-100 via-emerald-50 to-teal-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20';

export interface GlobalTimerState {
  isActive: boolean;
  timeLeft: number;
  mode: 'work' | 'break';
}

export const getBackgroundGradient = (globalTimer?: GlobalTimerState, currentTheme?: Theme) => {
  if (globalTimer?.isActive && globalTimer.timeLeft > 0) {
    return globalTimer.mode === 'work' ? WORK_TIMER_BACKGROUND : BREAK_TIMER_BACKGROUND;
  }
  return currentTheme?.gradient || DEFAULT_PAGE_BACKGROUND;
};

/**
 * Converts a hex color string (#rrggbb or #rgb) to an HSL space-separated string "h s% l%"
 * compatible with Tailwind CSS CSS variable variables.
 */
export const hexToHslString = (hex: string): string => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return '213 67% 50%'; // Fallback default blue HSL
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
};

/**
 * Adjusts hex color brightness by a percentage (e.g. -15 for darker hover state).
 */
export const adjustHexBrightness = (hex: string, percent: number): string => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return hex;

  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
  g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
  b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));

  const rr = r.toString(16).padStart(2, '0');
  const gg = g.toString(16).padStart(2, '0');
  const bb = b.toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
};


