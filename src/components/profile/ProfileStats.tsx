import { Clock, Users, BookOpen, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserStats } from '@/hooks/useProfileData';

export const ProfileStats = ({ stats }: { stats: UserStats }) => {
  const studyStats = [
    { label: 'Study Hours', value: stats.studyHours, icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Groups Joined', value: stats.groupsJoined, icon: Users, color: 'text-green-600 dark:text-green-400' },
    { label: 'Notes Shared', value: stats.notesShared, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Study Streak', value: `${stats.studyStreak} days`, icon: Star, color: 'text-orange-600 dark:text-orange-400' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {studyStats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.label} className="border-0 shadow-md dark:bg-gray-800">
            <CardContent className="p-4 text-center">
              <IconComponent size={24} className={`mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
