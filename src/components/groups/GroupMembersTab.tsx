import { useState, useEffect } from 'react';
import { Users, Crown, ChevronRight, UserCheck, Clock, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { FriendsService } from '@/services/database';
import { InviteFriendsDialog } from '../friends/InviteFriendsDialog';

export const GroupMembersTab = ({ members, groupId }: { members: any[]; groupId: string }) => {
  const { user } = useAuth();
  const { openProfile } = useUserProfileModal();
  const [friendships, setFriendships] = useState<Record<string, 'friends' | 'pending' | 'none'>>({});
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch user friendships to show badges
    Promise.all([
      FriendsService.getUserFriends(),
      FriendsService.getFriendRequests(),
      FriendsService.getSentFriendRequests()
    ]).then(([friends, received, sent]) => {
      const statusMap: Record<string, 'friends' | 'pending' | 'none'> = {};
      friends.forEach(f => { statusMap[f.user_id] = 'friends'; });
      received.forEach(r => { statusMap[r.user_id] = 'pending'; });
      sent.forEach(s => { statusMap[s.friend_id] = 'pending'; });
      setFriendships(statusMap);
    }).catch(err => {
      console.error("Error loading friendships for group members tab:", err);
    });
  }, [user]);

  if (members.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Users size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Members ({members.length})
        </h3>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
          size="sm"
        >
          <UserPlus size={15} />
          Invite Friends
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((member) => {
          const isCurrentUser = user?.id === member.id;
          const isAdmin = member.role === 'admin';
          const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
          const friendshipStatus = friendships[member.id] || 'none';
          
          return (
            <Card 
              key={member.id} 
              onClick={() => !isCurrentUser && openProfile(member.id)}
              className={`border-0 shadow-sm dark:bg-gray-800 transition-all group ${
                isCurrentUser 
                  ? 'ring-2 ring-blue-500' 
                  : 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] hover:bg-gray-50/55 dark:hover:bg-gray-700/55'
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-12 h-12 ${isAdmin ? 'bg-yellow-500' : 'bg-blue-500'} rounded-full flex items-center justify-center shrink-0`}>
                      <span className="text-white font-medium">{initials}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-gray-800 dark:text-white truncate text-sm">
                        {member.name}
                      </h3>
                      
                      {/* Status Badges */}
                      {isCurrentUser ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          You
                        </span>
                      ) : friendshipStatus === 'friends' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <UserCheck size={9} />
                          Friend
                        </span>
                      ) : friendshipStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock size={9} />
                          Pending
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</span>
                      {isAdmin && <Crown size={12} className="ml-1 text-yellow-500" />}
                    </div>
                  </div>
                </div>
                
                {/* Click indicator */}
                {!isCurrentUser && (
                  <div className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all pl-2 shrink-0">
                    <ChevronRight size={16} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <InviteFriendsDialog
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        type="group"
        id={groupId}
      />
    </div>
  );
};
