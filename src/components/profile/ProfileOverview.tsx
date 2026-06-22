import { Mail, Calendar } from 'lucide-react';
import { UserProfile } from '@/hooks/useProfileData';

interface ProfileOverviewProps {
  profile: UserProfile;
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
];

export const ProfileOverview = ({ profile }: ProfileOverviewProps) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarGradient = (name: string) => {
    const index = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const gradient = getAvatarGradient(profile.display_name);

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-white text-2xl font-semibold tracking-tight">
                {getInitials(profile.display_name)}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {profile.display_name}
          </h2>
          <div className="mt-1.5 flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Mail size={13} className="shrink-0" />
              {profile.email}
            </span>
            {profile.created_at && (
              <span className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                <Calendar size={13} className="shrink-0" />
                Joined {formatJoinDate(profile.created_at)}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {profile.bio}
            </p>
          )}
          {!profile.bio && (
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 italic">
              No bio yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
