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

export const DEFAULT_THEME: Theme = {
  name: 'Default Blue',
  primary: BRAND_PRIMARY,
  secondary: BRAND_PRIMARY_HOVER,
  gradient: 'from-blue-50 to-indigo-100'
};

export const COLOR_THEMES: Theme[] = [
  DEFAULT_THEME,
  { name: 'Ocean Blue', primary: '#1e40af', secondary: '#3b82f6', gradient: 'from-blue-100 to-blue-200' },
  { name: 'Forest Green', primary: '#166534', secondary: '#22c55e', gradient: 'from-green-100 to-green-200' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#a855f7', gradient: 'from-purple-100 to-purple-200' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#f97316', gradient: 'from-orange-100 to-orange-200' },
  { name: 'Rose Pink', primary: '#be185d', secondary: '#ec4899', gradient: 'from-pink-100 to-pink-200' },
  { name: 'Teal Ocean', primary: '#0f766e', secondary: '#14b8a6', gradient: 'from-teal-100 to-teal-200' },
  { name: 'Dark Navy', primary: '#1e293b', secondary: '#334155', gradient: 'from-slate-900 to-slate-800' },
  { name: 'Dark Forest', primary: '#1f2937', secondary: '#374151', gradient: 'from-gray-900 to-gray-800' },
  { name: 'Dark Purple', primary: '#4c1d95', secondary: '#6d28d9', gradient: 'from-purple-900 to-purple-800' },
  { name: 'Dark Red', primary: '#7f1d1d', secondary: '#b91c1c', gradient: 'from-red-900 to-red-800' },
  { name: 'Dark Emerald', primary: '#064e3b', secondary: '#047857', gradient: 'from-emerald-900 to-emerald-800' },
  { name: 'Midnight', primary: '#0f172a', secondary: '#1e293b', gradient: 'from-slate-950 to-slate-900' },
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
