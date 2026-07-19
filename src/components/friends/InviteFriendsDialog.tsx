import { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FriendsService, StudyGroupsService, StudySessionsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FriendItem {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  status: 'joined' | 'invited' | 'none';
}

interface InviteFriendsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'group' | 'session';
  id: string;
}

export const InviteFriendsDialog = ({ isOpen, onClose, type, id }: InviteFriendsDialogProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [groupMaxMembers, setGroupMaxMembers] = useState<number | null>(null);
  const [groupMemberCount, setGroupMemberCount] = useState<number>(0);

  const isFull = type === 'group' && groupMaxMembers !== null && groupMemberCount >= groupMaxMembers;

  useEffect(() => {
    if (isOpen && id) {
      loadData();
    }
  }, [isOpen, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const friendsList = await FriendsService.getUserFriends();

      if (type === 'group') {
        const [group, members, invitations] = await Promise.all([
          StudyGroupsService.getGroupById(id),
          StudyGroupsService.getGroupMembers(id),
          StudyGroupsService.getGroupInvitations(id)
        ]);

        setGroupMaxMembers(group?.max_members || null);
        setGroupMemberCount(members?.length || 0);

        const mapped: FriendItem[] = friendsList.map(friend => {
          const isMember = (members || []).some((m: any) => m.id === friend.user_id);
          const isInvited = (invitations || []).some((i: any) => i.invited_user_id === friend.user_id && i.status === 'pending');
          
          return {
            user_id: friend.user_id,
            display_name: friend.display_name,
            email: friend.email,
            avatar_url: friend.avatar_url,
            status: isMember ? 'joined' : isInvited ? 'invited' : 'none'
          };
        });
        setFriends(mapped);
      } else {
        const participants = await StudySessionsService.getParticipants(id);

        const mapped: FriendItem[] = friendsList.map(friend => {
          const participant = (participants || []).find((p: any) => p.user_id === friend.user_id);
          let status: 'joined' | 'invited' | 'none' = 'none';
          
          if (participant) {
            status = participant.status === 'invited' ? 'invited' : 'joined';
          }

          return {
            user_id: friend.user_id,
            display_name: friend.display_name,
            email: friend.email,
            avatar_url: friend.avatar_url,
            status
          };
        });
        setFriends(mapped);
      }
    } catch (err) {
      console.error('Error loading data for invite dialog:', err);
      toast.error('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (friendId: string) => {
    try {
      setInvitingId(friendId);
      if (type === 'group') {
        await StudyGroupsService.inviteUserToGroup(id, friendId);
        toast.success('Group invitation sent');
      } else {
        await StudySessionsService.inviteUserToSession(id, friendId);
        toast.success('Session invitation sent');
      }

      setFriends(prev => 
        prev.map(f => f.user_id === friendId ? { ...f, status: 'invited' } : f)
      );
    } catch (err) {
      console.error('Error sending invitation:', err);
      toast.error('Failed to send invitation');
    } finally {
      setInvitingId(null);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <UserPlus size={18} />
            </div>
            Invite Friends
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="space-y-3 pt-1.5">
          {isFull && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
              This group has reached its maximum member limit ({groupMaxMembers} members). You cannot invite more members.
            </div>
          )}

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends by name or email..."
              className="pl-9 bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#2a78d6]" />
                <span className="ml-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">Loading friends...</span>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus size={36} className="mx-auto text-gray-400 dark:text-zinc-500 mb-2" />
                <p className="text-gray-500 dark:text-zinc-400 text-xs font-semibold">
                  {searchQuery ? 'No friends match your search.' : 'You have no friends to invite.'}
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const initials = friend.display_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <div key={friend.user_id} className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0 border border-gray-200 dark:border-slate-700">
                        <AvatarImage src={friend.avatar_url || undefined} alt={friend.display_name} />
                        <AvatarFallback className="bg-[#2a78d6] text-white text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {friend.display_name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                          {friend.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {friend.status === 'joined' ? (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                          <Check size={14} /> Joined
                        </span>
                      ) : friend.status === 'invited' ? (
                        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 px-3 py-1 bg-gray-200 dark:bg-slate-800 rounded-lg">
                          Invited
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={invitingId === friend.user_id || isFull}
                          onClick={() => handleInvite(friend.user_id)}
                          className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1 transition-all duration-200"
                        >
                          {invitingId === friend.user_id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <UserPlus size={13} />
                          )}
                          Invite
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

