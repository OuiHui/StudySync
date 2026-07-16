import { useState, useMemo, useEffect } from 'react';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { CollaborativeNotes } from '@/components/notes/CollaborativeNotes';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { StudySessionsService, StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupData } from '@/hooks/useGroupData';
import { GroupPageHeader } from './GroupPageHeader';
import { GroupSessionsTab } from './GroupSessionsTab';
import { GroupMembersTab } from './GroupMembersTab';

interface GroupPageProps {
  groupId: string;
  onBack: () => void;
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void;
}

export const GroupPage = ({ groupId, onBack, onUpdateEnrollment }: GroupPageProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [enrolledOverride, setEnrolledOverride] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Load group invitations to check if user is invited
  useEffect(() => {
    const loadInvites = async () => {
      if (!user || !groupId) return;
      try {
        setLoadingInvites(true);
        const invites = await StudyGroupsService.getGroupInvitations(groupId);
        setInvitations(invites);
      } catch (err) {
        console.error('Error fetching group invitations:', err);
      } finally {
        setLoadingInvites(false);
      }
    };
    loadInvites();
  }, [groupId, user]);

  const { group, members, sessions, loading, error } = useGroupData(groupId);

  // Derive enrolled from live DB members; local override used for instant feedback
  const isMember = user ? members.some((m: any) => m.id === user.id) : false;
  const enrolled = enrolledOverride !== null ? enrolledOverride : isMember;

  // Derive attending sessions from live DB data instead of local state
  const attendingSessions = useMemo(() => {
    if (!user) return [];
    return sessions
      .filter(s => s.session_participants?.some((p: any) => p.user_id === user.id))
      .map(s => s.id);
  }, [sessions, user]);

  const handleLeaveGroup = async () => {
    try {
      await StudyGroupsService.leaveGroup(groupId);
      setEnrolledOverride(false);
      onUpdateEnrollment?.(groupId, false);
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  };

  const handleJoinGroup = async () => {
    try {
      await StudyGroupsService.joinGroup(groupId);
      setEnrolledOverride(true);
      onUpdateEnrollment?.(groupId, true);
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const handleAttendSession = async (sessionId: string) => {
    try {
      await StudySessionsService.planToAttendSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      window.dispatchEvent(new CustomEvent('sessionAttendanceChanged', {
        detail: { sessionId, groupName: group?.name, attending: true }
      }));
    } catch (err) {
      console.error('Error attending session:', err);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await StudySessionsService.leaveSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      window.dispatchEvent(new CustomEvent('sessionAttendanceChanged', {
        detail: { sessionId, groupName: group?.name, attending: false }
      }));
    } catch (err) {
      console.error('Error cancelling session attendance:', err);
    }
  };

  if (loading || loadingInvites) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading group...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12"><p className="text-red-600 dark:text-red-400">{error}</p></div>;
  }

  if (!group) return null;

  const isCreator = group.created_by === user?.id;
  const isInvited = invitations.some(inv => inv.invited_user_id === user?.id && inv.status === 'pending');
  const hasAccess = group.is_public !== false || enrolled || isCreator || isInvited;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-fade-in bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-8">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full">
          <Lock size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Private Group</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          This is a private study group. You cannot access this page unless you have been invited by a member of the group.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft size={16} className="mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const showInvitePrompt = group.is_public === false && !enrolled && !isCreator && isInvited;

  const handleAcceptInvite = async () => {
    try {
      await StudyGroupsService.acceptGroupInvitation(groupId);
      setEnrolledOverride(true);
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      const invites = await StudyGroupsService.getGroupInvitations(groupId);
      setInvitations(invites);
    } catch (err) {
      console.error('Error accepting group invitation:', err);
    }
  };

  const handleDeclineInvite = async () => {
    try {
      await StudyGroupsService.declineGroupInvitation(groupId);
      onBack();
    } catch (err) {
      console.error('Error declining group invitation:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <GroupPageHeader 
        group={group} 
        enrolled={enrolled} 
        onBack={onBack} 
        chatOpen={chatOpen}
        onChatToggle={() => setChatOpen(prev => !prev)}
        onSettingsOpen={() => setSettingsOpen(true)} 
        onLeaveGroup={handleLeaveGroup} 
        onJoinGroup={handleJoinGroup} 
        members={members}
      />
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
          {showInvitePrompt ? (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center space-y-4 my-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">You've been invited to join this group!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Accept the invitation to access the group's shared study sessions, collaborative notes, and group chat.
              </p>
              <div className="flex justify-center space-x-3">
                <Button onClick={handleDeclineInvite} variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-50">
                  Decline
                </Button>
                <Button onClick={handleAcceptInvite} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Accept Invitation
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex space-x-6 border-b dark:border-gray-800 pb-3 mb-6">
                {['sessions', 'notes', 'members'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative pb-3 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'sessions' && (
                <GroupSessionsTab sessions={sessions} attendingSessions={attendingSessions} onAttendSession={handleAttendSession} onCancelSession={handleCancelSession} />
              )}
              {activeTab === 'notes' && <CollaborativeNotes groupId={group.id} groupName={group.name} />}
              {activeTab === 'members' && <GroupMembersTab members={members} groupId={group.id} group={group} />}
            </>
          )}
        </div>

        {chatOpen && !showInvitePrompt && (
          <div className="w-full lg:w-80 shrink-0 sticky top-6 border-l dark:border-gray-700 pl-6 h-[600px]">
            <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} groupName={group.name} groupId={group.id} isInline={true} />
          </div>
        )}
      </div>

      <GroupSettingsDialog
        group={group}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onGroupUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['group', groupId] });
          queryClient.invalidateQueries({ queryKey: ['user-groups'] });
        }}
        onGroupDeleted={onBack}
      />
    </div>
  );
};
