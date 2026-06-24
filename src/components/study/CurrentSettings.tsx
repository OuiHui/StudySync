
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CurrentSettingsProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  onEdit?: () => void;
}

export const CurrentSettings = ({ workDuration, breakDuration, longBreakDuration, onEdit }: CurrentSettingsProps) => {
  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg dark:text-white">Timer Configuration</CardTitle>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              aria-label="Edit timer settings"
            >
              <Pencil size={15} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Work Duration</span>
            <span className="font-medium dark:text-white">{workDuration / 60} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Break Duration</span>
            <span className="font-medium dark:text-white">{breakDuration / 60} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Long Break</span>
            <span className="font-medium dark:text-white">{longBreakDuration / 60} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
