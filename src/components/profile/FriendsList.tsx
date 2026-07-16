import { UserMinus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Friend } from '@/hooks/useFriends';
import { getInitials, getDisplayName } from './FriendSearch';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';

interface FriendsListProps {
  friends: Friend[];
  handleRemoveFriend: (friendshipId: string, friendName: string) => void;
}

const avatarColors = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-fuchsia-500',
];

const getAvatarColor = (str: string) => avatarColors[(str?.charCodeAt(0) || 0) % avatarColors.length];

export const FriendsList = ({ friends, handleRemoveFriend }: FriendsListProps) => {
  const { openProfile } = useUserProfileModal();

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Friends
        </h3>
        {friends.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{friends.length}</span>
        )}
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Users size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No friends yet — search to add some.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {friends.map((friend) => {
            const name = getDisplayName(friend.display_name, friend.email);
            const initials = getInitials(friend.display_name, friend.email);
            const avatarBg = getAvatarColor(name);

            return (
              <div
                key={friend.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-55 dark:hover:bg-gray-800/40 transition-colors"
              >
                <button
                  onClick={() => openProfile(friend.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer focus:outline-none group"
                >
                  <div className={`w-8 h-8 rounded-full ${avatarBg} text-white flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform`}>
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{friend.email}</p>
                  </div>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveFriend(friend.friendshipId, name)}
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-gray-600 dark:hover:text-red-400 p-1.5 h-auto"
                >
                  <UserMinus size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
