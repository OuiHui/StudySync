import { Mail, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserProfile, UserStats } from '@/hooks/useProfileData';

interface ProfileOverviewProps {
  profile: UserProfile;
  stats: UserStats;
}

export const ProfileOverview = ({ profile, stats }: ProfileOverviewProps) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getUserLevel = () => {
    if (stats.studyHours >= 100) return 'Expert';
    if (stats.studyHours >= 50) return 'Advanced';
    if (stats.studyHours >= 20) return 'Intermediate';
    return 'Beginner';
  };

  const getUserPoints = () => {
    return stats.studyHours * 10 + stats.groupsJoined * 50 + stats.notesShared * 25 + stats.studyStreak * 15;
  };

  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-2xl font-bold">
                {getInitials(profile.display_name)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{profile.display_name}</h2>
            <p className="text-gray-600 dark:text-gray-300 flex items-center mt-1">
              <Mail size={16} className="mr-2" />
              {profile.email}
            </p>
            <p className="text-gray-600 dark:text-gray-300 flex items-center mt-1">
              <Calendar size={16} className="mr-2" />
              Joined {formatJoinDate(profile.created_at)}
            </p>
            <div className="mt-3 flex items-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                {getUserLevel()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {getUserPoints()} points
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-gray-700 dark:text-gray-300">
            {profile.bio || 'No bio provided yet.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
