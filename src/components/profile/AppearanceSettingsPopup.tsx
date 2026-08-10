import { Palette, X, RotateCcw, Sun, Moon, Laptop, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { COLOR_THEMES, DEFAULT_THEME, Theme } from '@/constants/theme';
import { useTheme, Mode } from '@/contexts/ThemeContext';

interface AppearanceSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceSettingsPopup = ({ isOpen, onClose }: AppearanceSettingsPopupProps) => {
  const themeContext = useTheme();

  const activeMode: Mode = themeContext.mode || 'system';
  const activeColorTheme: Theme = themeContext.colorTheme || DEFAULT_THEME;

  const handleModeSelect = (newMode: Mode) => {
    themeContext.setMode(newMode);
  };

  const handleThemeChange = (theme: Theme) => {
    themeContext.setColorTheme(theme);
  };

  const resetToDefault = () => {
    themeContext.setMode('dark');
    themeContext.resetColorTheme();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80 shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Palette size={18} />
            </div>
            Appearance & Theme
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-3 overflow-y-auto flex-1 custom-scrollbar">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Select standard light/dark mode or choose an accent color theme preset.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white h-7 px-2"
            >
              <RotateCcw size={12} className="mr-1" />
              Reset Defaults
            </Button>
          </div>

          {/* Theme Mode Section */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">
              Theme Mode
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleModeSelect('light')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                  activeMode === 'light'
                    ? 'border-brand ring-2 ring-brand/20 bg-blue-50/50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40'
                }`}
              >
                <Sun size={20} className="text-amber-500 mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect('dark')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                  activeMode === 'dark'
                    ? 'border-brand ring-2 ring-brand/20 bg-blue-50/50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40'
                }`}
              >
                <Moon size={20} className="text-indigo-400 mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect('system')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                  activeMode === 'system'
                    ? 'border-brand ring-2 ring-brand/20 bg-blue-50/50 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-gray-50/60 dark:bg-slate-900/40'
                }`}
              >
                <Laptop size={20} className="text-blue-500 mb-1.5" />
                <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">System</span>
              </button>
            </div>
          </div>

          {/* Accent Color Palette Presets */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-gray-800 dark:text-zinc-200">
              Color Theme Presets
            </h3>

            <div className="grid grid-cols-5 gap-2.5">
              {COLOR_THEMES.map((theme) => {
                const isSelected = activeColorTheme.name === theme.name;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    title={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 bg-gray-50 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden" style={{ backgroundColor: theme.primary }}>
                      <div className="absolute right-0 bottom-0 w-4 h-4 rounded-tl-full" style={{ backgroundColor: theme.secondary }} />
                      {isSelected && <Check size={14} className="text-white z-10 drop-shadow-sm" />}
                    </div>
                    <span className="text-[10px] mt-1.5 text-gray-600 dark:text-gray-400 font-medium truncate w-full text-center group-hover:text-gray-900 dark:group-hover:text-gray-200">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand hover:bg-brand-hover text-white rounded-xl px-5 h-10 text-sm font-semibold transition-all duration-200"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

