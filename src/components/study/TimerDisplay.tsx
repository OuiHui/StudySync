
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerDisplayProps {
  timeLeft: number;
  isActive: boolean;
  mode: 'work' | 'break';
  progress: number;
  onToggle: () => void;
  onReset: () => void;
}

export const TimerDisplay = ({
  timeLeft,
  isActive,
  mode,
  progress,
  onToggle,
  onReset
}: TimerDisplayProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-gray-200 dark:text-gray-600"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={`${mode === 'work' ? 'text-blue-500' : 'text-green-500'} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800 dark:text-white">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {mode === 'work' ? 'Work Time' : 'Break Time'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={onToggle}
          size="lg"
          className={`${mode === 'work' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
        >
          {isActive ? <Pause size={20} /> : <Play size={20} />}
          <span className="ml-2">{isActive ? 'Pause' : 'Start'}</span>
        </Button>
        <Button onClick={onReset} variant="outline" size="lg" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
          <RotateCcw size={20} />
          <span className="ml-2">Reset</span>
        </Button>
      </div>
    </>
  );
};
