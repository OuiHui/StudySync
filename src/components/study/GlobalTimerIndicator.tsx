
import { Clock, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GlobalTimerIndicatorProps {
  timeLeft: number;
  isActive: boolean;
  onToggle: () => void;
  formatTime: (seconds: number) => string;
}

export const GlobalTimerIndicator = ({ timeLeft, isActive, onToggle, formatTime }: GlobalTimerIndicatorProps) => {
  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 border-0 shadow-xl bg-white dark:bg-gray-800 min-w-[200px]">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Clock size={18} className="text-blue-500" />
            <span className="font-mono font-bold text-base text-gray-800 dark:text-white">{formatTime(timeLeft)}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="p-1.5 h-auto dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
