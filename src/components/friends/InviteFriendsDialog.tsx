import { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, Check, HelpCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    if (isOpen && id) {
      loadData();
    }
  }, [isOpen, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch user's friends list
      const friendsList = await FriendsService.getUserFriends();

      if (type === 'group') {
        // Fetch group members and invitations in parallel
        const [members, invitations] = await Promise.all([
          StudyGroupsService.getGroupMembers(id),
          StudyGroupsService.getGroupInvitations(id)
        ]);

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
        // Fetch session participants (both active and invited)
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
      <DialogContent className="sm:max-w-md dark:bg-gray-800 border-gray-250 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-white">
            Invite Friends
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {type === 'group' 
              ? 'Invite your friends to join this study group.'
              : 'Invite your friends to join this study session.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by name or email..."
            className="pl-9 pr-4 dark:bg-gray-750 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-3 py-1 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500 dark:text-gray-300">Loading friends...</span>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
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
                <div key={friend.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={friend.avatar_url || undefined} alt={friend.display_name} />
                      <AvatarFallback className="bg-blue-500 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                        {friend.display_name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {friend.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {friend.status === 'joined' ? (
                      <Button variant="ghost" disabled size="sm" className="h-8 text-xs text-green-600 dark:text-green-400 font-medium">
                        <Check size={12} className="mr-1" /> Joined
                      </Button>
                    ) : friend.status === 'invited' ? (
                      <Button variant="secondary" disabled size="sm" className="h-8 text-xs font-medium dark:bg-gray-700 dark:text-gray-300">
                        Invited
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        disabled={invitingId === friend.user_id}
                        onClick={() => handleInvite(friend.user_id)}
                      >
                        {invitingId === friend.user_id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <UserPlus size={12} className="mr-1" />
                        )}
                        Invite
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
