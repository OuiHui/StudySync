import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { CollaborativeNotes } from '@/components/notes/CollaborativeNotes';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { useGroupData } from '@/hooks/useGroupData';
import { GroupPageHeader } from './GroupPageHeader';
import { GroupSessionsTab } from './GroupSessionsTab';
import { GroupMembersTab } from './GroupMembersTab';

interface GroupPageProps {
  groupId: string;
  onBack: () => void;
  isEnlisted?: boolean;
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void;
}

export const GroupPage = ({ groupId, onBack, isEnlisted = true, onUpdateEnrollment }: GroupPageProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [enrolled, setEnrolled] = useState(isEnlisted);
  const [attendingSessions, setAttendingSessions] = useState<string[]>(['1']);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { group, members, sessions, loading, error } = useGroupData(groupId);

  const handleLeaveGroup = () => {
    setEnrolled(false);
    onUpdateEnrollment?.(groupId, false);
  };

  const handleJoinGroup = () => {
    setEnrolled(true);
    onUpdateEnrollment?.(groupId, true);
  };

  const handleAttendSession = (sessionId: string) => {
    setAttendingSessions(prev => [...prev, sessionId]);
    window.dispatchEvent(new CustomEvent('sessionAttendanceChanged', {
      detail: { sessionId, groupName: group?.name, attending: true }
    }));
  };

  const handleCancelSession = (sessionId: string) => {
    setAttendingSessions(prev => prev.filter(id => id !== sessionId));
    window.dispatchEvent(new CustomEvent('sessionAttendanceChanged', {
      detail: { sessionId, groupName: group?.name, attending: false }
    }));
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
