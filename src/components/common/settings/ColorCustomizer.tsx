import { useState } from 'react';
import { Palette, RotateCcw, Sun, Moon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COLOR_THEMES, DEFAULT_THEME, Theme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ColorCustomizerProps {
  onThemeChange?: (theme: Theme) => void;
  currentTheme?: Theme;
}

export const ColorCustomizer = ({ onThemeChange, currentTheme }: ColorCustomizerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const themeContext = useTheme();

  const activeColorTheme: Theme = currentTheme || themeContext.colorTheme || DEFAULT_THEME;

  const handleThemeChange = (theme: Theme) => {
    themeContext.setColorTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const resetToDefault = () => {
    themeContext.resetColorTheme();
    if (onThemeChange) {
      onThemeChange(DEFAULT_THEME);
    }
  };

  const defaultThemes = COLOR_THEMES.filter(t => t.id === 'default-light' || t.id === 'default-dark');
  const colorPresets = COLOR_THEMES.filter(t => t.id !== 'default-light' && t.id !== 'default-dark');

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 rounded-xl border border-border bg-card/90 hover:bg-brand/10 hover:border-brand/40 text-card-foreground hover:text-brand transition-all duration-200 shadow-sm px-3.5 h-9"
        >
          <div 
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs" 
            style={{ backgroundColor: activeColorTheme.primary }} 
          />
          <Palette size={15} className="text-brand" />
          <span className="font-semibold text-xs">Theme Options</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-4 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="font-semibold text-sm">Theme Presets</h3>
              <p className="text-xs text-muted-foreground">Select a theme to customize the platform</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs text-muted-foreground hover:text-foreground h-7 px-2">
              <RotateCcw size={12} className="mr-1" />
              Reset
            </Button>
          </div>

          {/* Default Themes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Default Themes
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {defaultThemes.map((theme) => {
                const isSelected = activeColorTheme.id === theme.id || activeColorTheme.name === theme.name;
                const isLight = theme.mode === 'light';
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 bg-muted/80'
                        : 'border-border hover:border-muted-foreground/30 bg-muted/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs ${isLight ? 'bg-amber-400 text-amber-950' : 'bg-indigo-900 text-indigo-100'}`}>
                      {isLight ? <Sun size={13} /> : <Moon size={13} />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{theme.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{isLight ? 'Light Mode' : 'Dark Mode'}</div>
                    </div>
                    {isSelected && <Check size={14} className="text-brand flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Color Theme Presets
            </label>

            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((theme) => {
                const isSelected = activeColorTheme.id === theme.id || activeColorTheme.name === theme.name;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 bg-muted/80'
                        : 'border-border hover:border-muted-foreground/30 bg-muted/20'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden shrink-0" style={{ backgroundColor: theme.primary }}>
                      <div className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-tl-full" style={{ backgroundColor: theme.secondary }} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate group-hover:text-foreground">
                      {theme.name}
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
