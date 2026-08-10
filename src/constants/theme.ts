export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  gradient: string;
}

export const BRAND_PRIMARY = '#2a78d6';
export const BRAND_PRIMARY_HOVER = '#2268bc';
export const BRAND_BUTTON_CLASS = 'bg-brand hover:bg-brand-hover text-white';
export const BRAND_TEXT_CLASS = 'text-brand';
export const BRAND_BORDER_CLASS = 'border-brand';
export const PAGE_TITLE_CLASS = 'text-3xl font-bold text-gray-800 dark:text-white';

export const DEFAULT_THEME: Theme = {
  name: 'Default Blue',
  primary: BRAND_PRIMARY,
  secondary: BRAND_PRIMARY_HOVER,
  gradient: 'from-blue-50 to-indigo-100'
};

export const COLOR_THEMES: Theme[] = [
  DEFAULT_THEME,
  { name: 'Ocean Blue', primary: '#1d4ed8', secondary: '#3b82f6', gradient: 'from-blue-100 to-sky-200' },
  { name: 'Emerald Green', primary: '#059669', secondary: '#10b981', gradient: 'from-emerald-100 to-teal-200' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#a855f7', gradient: 'from-purple-100 to-violet-200' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#f97316', gradient: 'from-orange-100 to-amber-200' },
  { name: 'Rose Pink', primary: '#e11d48', secondary: '#f43f5e', gradient: 'from-rose-100 to-pink-200' },
  { name: 'Teal Cyan', primary: '#0d9488', secondary: '#14b8a6', gradient: 'from-teal-100 to-cyan-200' },
  { name: 'Crimson Red', primary: '#dc2626', secondary: '#ef4444', gradient: 'from-red-100 to-rose-200' },
  { name: 'Slate Gray', primary: '#475569', secondary: '#64748b', gradient: 'from-slate-100 to-gray-200' },
  { name: 'Amber Gold', primary: '#d97706', secondary: '#f59e0b', gradient: 'from-amber-100 to-yellow-200' },
];

export const DEFAULT_PAGE_BACKGROUND = 'from-background to-muted dark:from-background dark:to-muted';
export const WORK_TIMER_BACKGROUND = 'from-blue-100 via-purple-50 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20';
export const BREAK_TIMER_BACKGROUND = 'from-green-100 via-emerald-50 to-teal-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20';

export interface GlobalTimerState {
  isActive: boolean;
  timeLeft: number;
  mode: 'work' | 'break';
}

export const getBackgroundGradient = (globalTimer?: GlobalTimerState) => {
  if (globalTimer?.isActive && globalTimer.timeLeft > 0) {
    return globalTimer.mode === 'work' ? WORK_TIMER_BACKGROUND : BREAK_TIMER_BACKGROUND;
  }
  return DEFAULT_PAGE_BACKGROUND;
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


