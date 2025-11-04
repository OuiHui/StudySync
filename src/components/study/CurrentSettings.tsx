
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CurrentSettingsProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
}

export const CurrentSettings = ({ workDuration, breakDuration, longBreakDuration }: CurrentSettingsProps) => {
  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Current Settings</CardTitle>
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
