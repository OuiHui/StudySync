import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerDisplayProps {
  timeLeft: number;
  isActive: boolean;
  mode: 'work' | 'break';
  progress: number;
  onToggle: () => void;
  onReset: () => void;
  onFinish?: () => void;
  showFinishButton?: boolean;
  onSettingsClick?: () => void;
}

export const TimerDisplay = ({
  timeLeft,
  isActive,
  mode,
  progress,
  onToggle,
  onReset,
  onFinish,
  showFinishButton = false,
  onSettingsClick
}: TimerDisplayProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Timer Circular Progress Dial */}
      <div className="relative w-72 h-72 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            className={`${mode === 'work' ? 'text-blue-500' : 'text-green-500'} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white">{formatTime(timeLeft)}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 mt-1">
              {mode === 'work' ? 'work time' : 'break time'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex justify-center items-center space-x-2 mt-6 shrink-0">
        <Button
          onClick={onToggle}
          className={`h-9 px-4 text-xs font-semibold ${mode === 'work' ? 'bg-brand hover:bg-brand-hover text-white' : 'bg-green-600 hover:bg-green-700 text-white'} rounded-lg flex items-center space-x-1.5`}
        >
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          <span className="lowercase">{isActive ? 'pause' : 'start'}</span>
        </Button>
        <Button 
          onClick={onReset} 
          variant="outline" 
          className="h-9 w-9 p-0 border border-gray-200 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center shrink-0"
          title="Reset timer"
        >
          <RotateCcw size={14} />
        </Button>
        {onSettingsClick && (
          <Button 
            onClick={onSettingsClick} 
            variant="outline" 
            className="h-9 w-9 p-0 border border-gray-200 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center shrink-0"
            title="Session settings"
          >
            <Settings size={14} />
          </Button>
        )}
        {showFinishButton && onFinish && (
          <Button 
            onClick={onFinish} 
            variant="secondary" 
            className="h-9 px-3 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
          >
            Finish Session
          </Button>
        )}
      </div>
    </div>
  );
};
