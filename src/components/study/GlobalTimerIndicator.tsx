
import { Clock, Pause, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GlobalTimerIndicatorProps {
  timeLeft: number;
  isActive: boolean;
  onToggle: () => void;
  onCancel?: () => void;
  formatTime: (seconds: number) => string;
}

export const GlobalTimerIndicator = ({ timeLeft, isActive, onToggle, onCancel, formatTime }: GlobalTimerIndicatorProps) => {
  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 border-0 shadow-xl bg-white dark:bg-gray-800 min-w-[200px]">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Clock size={18} className="text-blue-500" />
            <span className="font-mono font-bold text-base text-gray-800 dark:text-white">{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggle}
              className="p-1.5 h-auto dark:text-gray-300 dark:hover:bg-gray-700"
              title={isActive ? "Pause" : "Resume"}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="p-1.5 h-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                title="Cancel Timer"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
