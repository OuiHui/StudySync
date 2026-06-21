import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/hooks/useProfileData';

export const ProfileAchievements = ({ stats }: { stats: UserStats }) => {
  const achievements = [
    { id: '1', title: 'Study Streak', description: `${stats.studyStreak} days consecutive`, icon: '🔥', earned: stats.studyStreak > 0 },
    { id: '2', title: 'Note Sharer', description: `Shared ${stats.notesShared}+ notes`, icon: '📚', earned: stats.notesShared >= 5 },
    { id: '3', title: 'Group Member', description: `Joined ${stats.groupsJoined} groups`, icon: '👥', earned: stats.groupsJoined >= 2 },
    { id: '4', title: 'Study Master', description: `${stats.studyHours} hours studied`, icon: '⏰', earned: stats.studyHours >= 50 },
    { id: '5', title: 'Session Starter', description: `${stats.totalSessions} sessions created`, icon: '🎯', earned: stats.totalSessions >= 10 },
    { id: '6', title: 'Collaboration Expert', description: 'Join 5+ groups', icon: '🤝', earned: stats.groupsJoined >= 5 },
  ];

  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-800 dark:text-white">
          <Trophy size={20} className="mr-2 text-yellow-500" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`p-3 rounded-lg border-2 transition-all ${
                achievement.earned 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <h4 className={`font-medium text-sm ${
                achievement.earned 
                  ? 'text-yellow-800 dark:text-yellow-200' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {achievement.title}
              </h4>
              <p className={`text-xs ${
                achievement.earned 
                  ? 'text-yellow-600 dark:text-yellow-300' 
                  : 'text-gray-500 dark:text-gray-500'
              }`}>
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
