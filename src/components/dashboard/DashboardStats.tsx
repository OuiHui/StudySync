import { Clock, Users, BookOpen, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserStats } from '@/hooks/useDashboardData';

export const DashboardStats = ({ stats }: { stats: UserStats }) => {
  const statItems = [
    { label: 'Study Hours Today', value: stats.studyHoursToday, icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Groups', value: stats.activeGroups, icon: Users, color: 'text-green-600 dark:text-green-400' },
    { label: 'Notes Shared', value: stats.notesShared, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Sessions This Week', value: stats.sessionsThisWeek, icon: Calendar, color: 'text-orange-600 dark:text-orange-400' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((stat, index) => (
        <Card key={index} className="border-0 shadow-md dark:bg-gray-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">{stat.value}</p>
              </div>
              <stat.icon size={20} className={stat.color} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
