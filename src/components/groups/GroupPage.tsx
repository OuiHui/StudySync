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
        onChatOpen={() => setChatOpen(true)} 
        onSettingsOpen={() => setSettingsOpen(true)} 
        onLeaveGroup={handleLeaveGroup} 
        onJoinGroup={handleJoinGroup} 
      />

      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-6">
          <p className="text-gray-700 dark:text-gray-300">{group.description}</p>
        </CardContent>
      </Card>
      
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {['sessions', 'notes', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'sessions' && (
        <GroupSessionsTab sessions={sessions} attendingSessions={attendingSessions} onAttendSession={handleAttendSession} onCancelSession={handleCancelSession} />
      )}
      {activeTab === 'notes' && <CollaborativeNotes groupId={group.id} groupName={group.name} />}
      {activeTab === 'members' && <GroupMembersTab members={members} />}

      <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} groupName={group.name} groupId={group.id} />
      <GroupSettingsDialog group={group} open={settingsOpen} onOpenChange={setSettingsOpen} onGroupUpdated={() => {}} onGroupDeleted={onBack} />
    </div>
  );
};
