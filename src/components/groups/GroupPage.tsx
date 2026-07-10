import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
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
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [enrolledOverride, setEnrolledOverride] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();
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
      await StudySessionsService.joinSession(sessionId);
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

  if (loading) {
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
          {activeTab === 'members' && <GroupMembersTab members={members} />}
        </div>

        {chatOpen && (
          <div className="w-full lg:w-80 shrink-0 sticky top-6 border-l dark:border-gray-700 pl-6 h-[600px]">
            <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} groupName={group.name} groupId={group.id} isInline={true} />
          </div>
        )}
      </div>

      <GroupSettingsDialog group={group} open={settingsOpen} onOpenChange={setSettingsOpen} onGroupUpdated={() => {}} onGroupDeleted={onBack} />
    </div>
  );
};
