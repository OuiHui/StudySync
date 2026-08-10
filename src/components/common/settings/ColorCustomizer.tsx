
import { useState } from 'react';
import { Palette, RotateCcw, Sun, Moon, Laptop, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COLOR_THEMES, DEFAULT_THEME, Theme } from '@/constants/theme';
import { useTheme, Mode } from '@/contexts/ThemeContext';

interface ColorCustomizerProps {
  onThemeChange?: (theme: Theme) => void;
  currentTheme?: Theme;
}

export const ColorCustomizer = ({ onThemeChange, currentTheme }: ColorCustomizerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const themeContext = useTheme();

  const activeMode: Mode = themeContext.mode || 'system';
  const activeColorTheme: Theme = currentTheme || themeContext.colorTheme || DEFAULT_THEME;

  const handleModeSelect = (newMode: Mode) => {
    themeContext.setMode(newMode);
  };

  const handleThemeChange = (theme: Theme) => {
    themeContext.setColorTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const resetToDefault = () => {
    themeContext.setMode('dark');
    themeContext.resetColorTheme();
    if (onThemeChange) {
      onThemeChange(DEFAULT_THEME);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div 
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm" 
            style={{ backgroundColor: activeColorTheme.primary }} 
          />
          <Palette size={15} />
          <span className="font-medium">Theme Options</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Appearance & Theme</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Personalize mode & accent colors</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white h-7 px-2">
              <RotateCcw size={12} className="mr-1" />
              Reset
            </Button>
          </div>

          {/* Mode Toggle (Light / Dark / System) */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-lg border border-gray-200/60 dark:border-gray-700/60">
              <button
                type="button"
                onClick={() => handleModeSelect('light')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sun size={13} className="text-amber-500" />
                Light
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect('dark')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'dark'
                    ? 'bg-gray-900 text-white shadow-sm dark:bg-gray-700'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Moon size={13} className="text-indigo-400" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleModeSelect('system')}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeMode === 'system'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Laptop size={13} className="text-blue-500" />
                System
              </button>
            </div>
          </div>

          {/* Accent Color Presets */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Color Theme Presets
            </label>

            <div className="grid grid-cols-5 gap-2">
              {COLOR_THEMES.map((theme) => {
                const isSelected = activeColorTheme.name === theme.name;
                return (
                  <button
                    key={theme.name}
                    type="button"
                    title={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 bg-gray-50 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden" style={{ backgroundColor: theme.primary }}>
                      <div className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-tl-full" style={{ backgroundColor: theme.secondary }} />
                      {isSelected && <Check size={12} className="text-white z-10 drop-shadow-sm" />}
                    </div>
                    <span className="text-[10px] mt-1 text-gray-600 dark:text-gray-400 font-medium truncate w-full text-center group-hover:text-gray-900 dark:group-hover:text-gray-200">
                      {theme.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};


