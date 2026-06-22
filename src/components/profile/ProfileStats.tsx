import { Clock, Users, BookOpen, Flame } from 'lucide-react';
import { UserStats } from '@/hooks/useProfileData';

export const ProfileStats = ({ stats }: { stats: UserStats }) => {
  const studyStats = [
    { label: 'Study Hours', value: stats.studyHours, icon: Clock, accent: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Groups', value: stats.groupsJoined, icon: Users, accent: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Notes Shared', value: stats.notesShared, icon: BookOpen, accent: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Day Streak', value: `${stats.studyStreak}`, icon: Flame, accent: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {studyStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 px-4 py-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={stat.accent} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
