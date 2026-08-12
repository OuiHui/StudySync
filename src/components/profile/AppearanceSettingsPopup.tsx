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
    themeContext.resetColorTheme();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-popover text-popover-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Palette size={18} />
            </div>
            Appearance & Theme
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-3 overflow-y-auto flex-1 custom-scrollbar">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Choose a theme preset to customize the entire platform theme.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              <RotateCcw size={12} className="mr-1" />
              Reset Defaults
            </Button>
          </div>

          {/* Default Themes */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm">
              Default Themes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_THEMES.filter(t => t.id === 'default-light' || t.id === 'default-dark').map((theme) => {
                const isSelected = activeColorTheme.id === theme.id || activeColorTheme.name === theme.name;
                const isLight = theme.mode === 'light';
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 bg-muted/80'
                        : 'border-border hover:border-muted-foreground/30 bg-muted/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${isLight ? 'bg-amber-400 text-amber-950' : 'bg-indigo-900 text-indigo-100'}`}>
                      {isLight ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{theme.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{isLight ? 'Light Mode' : 'Dark Mode'}</div>
                    </div>
                    {isSelected && <Check size={18} className="text-brand flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Theme Presets */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm">
              Color Theme Presets
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {COLOR_THEMES.filter(t => t.id !== 'default-light' && t.id !== 'default-dark').map((theme) => {
                const isSelected = activeColorTheme.id === theme.id || activeColorTheme.name === theme.name;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 bg-muted/80'
                        : 'border-border hover:border-muted-foreground/30 bg-muted/20'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm relative overflow-hidden shrink-0" style={{ backgroundColor: theme.primary }}>
                      <div className="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-tl-full" style={{ backgroundColor: theme.secondary }} />
                      {isSelected && <Check size={12} className="text-white z-10 drop-shadow-sm" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold truncate group-hover:text-foreground">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-border shrink-0">
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

