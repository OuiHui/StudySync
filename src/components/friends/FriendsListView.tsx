import { useState, useEffect } from 'react';
import { ArrowLeft, Search, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FriendEntry } from './types';
import { getInitials, getAvatarColor } from './avatarUtils';
import { FriendsService } from '@/services/database';
import { isValidImageUrl } from '@/lib/utils';

interface FriendsListViewProps {
  targetUserId: string;
  friendsCount: number;
  currentUserId: string;
  onBack: () => void;
  onRequestSent?: (friendUserId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

export const FriendsListView = ({
  targetUserId,
  friendsCount,
  currentUserId,
  onBack,
  onRequestSent,
  onOpenProfile,
}: FriendsListViewProps) => {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const [friendsResponse, myFriendshipsResponse] = await Promise.all([
          (supabase.rpc as any)('get_user_friends', {
            target_user_id: targetUserId,
            current_user_id: currentUserId,
          }),
          supabase
            .from('friendships' as any)
            .select('*')
            .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        ]);

        if (friendsResponse.error) {
          console.error('Error fetching user friends:', friendsResponse.error);
          return;
        }

        const friendsList = (friendsResponse.data as unknown as FriendEntry[]) || [];

        if (myFriendshipsResponse.error) {
          console.error('Error fetching current user friendships:', myFriendshipsResponse.error);
          setFriends(friendsList);
        } else {
          const friendshipsMap = new Map<string, { status: string; id: string }>();
          (myFriendshipsResponse.data || []).forEach((f: any) => {
            const otherId = f.user_id === currentUserId ? f.friend_id : f.user_id;
            friendshipsMap.set(otherId, { status: f.status, id: f.id });
          });

          const enrichedFriends = friendsList.map((friend) => {
            const rel = friendshipsMap.get(friend.friend_user_id);
            return {
              ...friend,
              friendship_status: rel ? rel.status : 'none',
              friendship_id: rel ? rel.id : undefined,
            };
          });

          setFriends(enrichedFriends);
        }
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
      onRequestSent?.(friendUserId);
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
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-base font-semibold text-foreground">
          Friends ({friendsCount})
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand font-medium"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((friend) => {
            const avatarBg = getAvatarColor(friend.display_name);
            const initials = getInitials(friend.display_name);
            const isPending = pendingAdds.has(friend.friend_user_id) || friend.friendship_status === 'pending';
            const isAccepted = friend.is_mutual || friend.friendship_status === 'accepted';

            return (
              <div
                key={friend.friend_user_id}
                className="flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-muted/60 transition-colors"
              >
                {/* Clickable Profile wrapper */}
                <button
                  onClick={() => friend.friend_user_id !== currentUserId && onOpenProfile?.(friend.friend_user_id)}
                  disabled={friend.friend_user_id === currentUserId}
                  className={`flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none group ${
                    friend.friend_user_id !== currentUserId ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full ${avatarBg} text-white flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform`}
                  >
                    {friend.avatar_url && isValidImageUrl(friend.avatar_url) ? (
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
                    <p className="text-base font-bold text-foreground truncate group-hover:text-brand transition-colors">
                      {friend.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate font-semibold">
                      {friend.major || 'Unknown Major'}
                    </p>
                  </div>
                </button>

                {/* Mutual / Add friend */}
                {friend.friend_user_id === currentUserId ? (
                  <span className="text-sm font-semibold text-muted-foreground shrink-0">
                    You
                  </span>
                ) : isAccepted ? (
                  <div className="flex items-center gap-1.5 shrink-0 text-emerald-500 font-semibold">
                    <UserCheck size={15} />
                    <span className="text-sm">Mutual!</span>
                  </div>
                ) : isPending ? (
                  <span className="text-xs font-semibold text-amber-500 shrink-0">
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(friend.friend_user_id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors shrink-0"
                    title="Add friend"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              No friends found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
