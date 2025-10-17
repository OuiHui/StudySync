
import { useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const colorThemes = [
  { name: 'Default Blue', primary: '#3b82f6', secondary: '#1e40af', gradient: 'from-blue-50 to-indigo-100' },
  { name: 'Ocean Blue', primary: '#1e40af', secondary: '#3b82f6', gradient: 'from-blue-100 to-blue-200' },
  { name: 'Forest Green', primary: '#166534', secondary: '#22c55e', gradient: 'from-green-100 to-green-200' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#a855f7', gradient: 'from-purple-100 to-purple-200' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#f97316', gradient: 'from-orange-100 to-orange-200' },
  { name: 'Rose Pink', primary: '#be185d', secondary: '#ec4899', gradient: 'from-pink-100 to-pink-200' },
  { name: 'Teal Ocean', primary: '#0f766e', secondary: '#14b8a6', gradient: 'from-teal-100 to-teal-200' },
  // Dark themes with proper readability
  { name: 'Dark Navy', primary: '#1e293b', secondary: '#334155', gradient: 'from-slate-900 to-slate-800' },
  { name: 'Dark Forest', primary: '#1f2937', secondary: '#374151', gradient: 'from-gray-900 to-gray-800' },
  { name: 'Dark Purple', primary: '#4c1d95', secondary: '#6d28d9', gradient: 'from-purple-900 to-purple-800' },
  { name: 'Dark Red', primary: '#7f1d1d', secondary: '#b91c1c', gradient: 'from-red-900 to-red-800' },
  { name: 'Dark Emerald', primary: '#064e3b', secondary: '#047857', gradient: 'from-emerald-900 to-emerald-800' },
  { name: 'Midnight', primary: '#0f172a', secondary: '#1e293b', gradient: 'from-slate-950 to-slate-900' },
];

interface ColorCustomizerProps {
  onThemeChange: (theme: typeof colorThemes[0]) => void;
  currentTheme: typeof colorThemes[0];
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
    onThemeChange(colorThemes[0]);
    document.documentElement.classList.remove('dark');
    setIsOpen(false);
  };

  const isDarkTheme = (theme: typeof colorThemes[0]) => {
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
            {colorThemes.map((theme) => (
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
