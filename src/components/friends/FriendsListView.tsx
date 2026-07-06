import { useState, useEffect } from 'react';
import { ArrowLeft, Search, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FriendEntry } from './types';
import { getInitials, getAvatarGradient } from './avatarUtils';
import { FriendsService } from '@/services/database';

interface FriendsListViewProps {
  targetUserId: string;
  friendsCount: number;
  currentUserId: string;
  onBack: () => void;
}

export const FriendsListView = ({
  targetUserId,
  friendsCount,
  currentUserId,
  onBack,
}: FriendsListViewProps) => {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_user_friends', {
          target_user_id: targetUserId,
          current_user_id: currentUserId,
        });
        if (!error) setFriends((data as FriendEntry[]) || []);
      } catch (e) {
        console.error('Error fetching user friends:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [targetUserId, currentUserId]);

  const handleAdd = async (friendUserId: string) => {
    try {
      await FriendsService.sendFriendRequest(friendUserId);
      setPendingAdds((prev) => new Set(prev).add(friendUserId));
    } catch (e) {
      console.error('Error sending friend request:', e);
    }
  };

  const filtered = friends.filter(
    (f) =>
      f.display_name.toLowerCase().includes(search.toLowerCase()) ||
      f.major.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Friends ({friendsCount})
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.06] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-gray-400 dark:text-gray-600" />
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((friend) => {
            const gradient = `${friend.gradient_from} ${friend.gradient_to}`;
            const initials = getInitials(friend.display_name);
            const isPending = pendingAdds.has(friend.friend_user_id);

            return (
              <div
                key={friend.friend_user_id}
                className="flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.display_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-bold">{initials}</span>
                  )}
                </div>

                {/* Name + major */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {friend.display_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-450 truncate font-semibold">
                    {friend.major || 'Unknown Major'}
                  </p>
                </div>

                {/* Mutual / Add friend */}
                {friend.is_mutual ? (
                  <div className="flex items-center gap-1.5 shrink-0 text-emerald-500 dark:text-emerald-400">
                    <UserCheck size={15} />
                    <span className="text-sm font-semibold">Mutual!</span>
                  </div>
                ) : isPending ? (
                  <span className="text-xs font-semibold text-amber-500 dark:text-amber-400 shrink-0">
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(friend.friend_user_id)}
                    className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors shrink-0"
                    title="Add friend"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-10">
              No friends found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
