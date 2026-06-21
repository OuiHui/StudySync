import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/hooks/useDashboardData';

export const StudyProgress = ({ stats }: { stats: UserStats }) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-white">Study Progress This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">Study Hours This Week</span>
              <span className="text-gray-800 dark:text-white">{stats.studyHoursThisWeek}/40 hours</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min((parseFloat(stats.studyHoursThisWeek.replace('h', '')) / 40) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">Sessions Completed</span>
              <span className="text-gray-800 dark:text-white">{stats.sessionsThisWeek}/10 sessions</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${Math.min((parseInt(stats.sessionsThisWeek) / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
