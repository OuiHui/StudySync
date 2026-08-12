
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
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 border border-border shadow-2xl bg-card/95 text-card-foreground backdrop-blur-md min-w-[200px] rounded-2xl">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Clock size={18} className="text-brand" />
            <span className="font-mono font-bold text-base text-foreground">{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggle}
              className="p-1.5 h-auto text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title={isActive ? "Pause" : "Resume"}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="p-1.5 h-auto text-red-500 hover:text-red-700 hover:bg-muted rounded-lg transition-colors"
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
