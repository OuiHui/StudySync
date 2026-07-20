
import { useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COLOR_THEMES, DEFAULT_THEME, Theme } from '@/constants/theme';

interface ColorCustomizerProps {
  onThemeChange: (theme: Theme) => void;
  currentTheme: Theme;
}

export const ColorCustomizer = ({ onThemeChange, currentTheme }: ColorCustomizerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (theme: typeof colorThemes[0]) => {
    onThemeChange(theme);
    setIsOpen(false);
    
    // Apply dark mode class to body when using dark themes
    const isDark = isDarkTheme(theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const resetToDefault = () => {
    onThemeChange(DEFAULT_THEME);
    document.documentElement.classList.remove('dark');
    setIsOpen(false);
  };

  const isDarkTheme = (theme: Theme) => {
    return theme.name.toLowerCase().includes('dark') || theme.name.toLowerCase().includes('midnight');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <Palette size={16} className="mr-2" />
          Customize Colors
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4 bg-white dark:bg-gray-800 border dark:border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Color Theme</h3>
            <Button variant="ghost" size="sm" onClick={resetToDefault}>
              <RotateCcw size={14} className="mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {COLOR_THEMES.map((theme) => (
              <Card 
                key={theme.name}
                className={`cursor-pointer transition-all border-2 ${
                  currentTheme.name === theme.name 
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => handleThemeChange(theme)}
              >
                <CardContent className="p-3">
                  <div className={`h-12 rounded-lg bg-gradient-to-r ${theme.gradient} mb-2 relative overflow-hidden`}>
                    <div className="h-full flex items-center justify-center space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20" 
                        style={{ backgroundColor: theme.primary }}
                      ></div>
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20" 
                        style={{ backgroundColor: theme.secondary }}
                      ></div>
                    </div>
                    {isDarkTheme(theme) && (
                      <div className="absolute top-1 right-1">
                        <span className="text-xs text-white/80">🌙</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-center text-gray-800 dark:text-gray-200">
                    {theme.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
