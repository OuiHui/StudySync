import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { GroupDetails } from '@/components/groups/GroupDetails';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserGroups } from '@/hooks/useUserGroups';
import { GroupsDashboard } from '@/components/groups/GroupsDashboard';
import { GroupsGrid } from '@/components/groups/GroupsGrid';

interface StudyGroupsProps {
  onSelectGroup?: (groupId: string) => void;
}

export const StudyGroups = ({ onSelectGroup }: StudyGroupsProps) => {
  const { user } = useAuth();
  const {
    studyGroups,
    loading,
    error,
    isAnonymousUser,
    loadUserGroups,
    handleJoinGroup,
    handleLeaveGroup,
    handleGroupUpdated,
    handleGroupDeleted
  } = useUserGroups();
  
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<any | null>(null);

  const filteredGroups = studyGroups.filter(group =>
    (group.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openGroupDetails = (group: any) => {
    setSelectedGroupDetails(group);
  };

  const openGroupPage = (groupId: string) => {
    if (onSelectGroup) {
      onSelectGroup(groupId);
    }
  };

  const openChat = (groupName: string, groupId: string) => {
    setSelectedGroupName(groupName);
    setSelectedGroupId(groupId);
    setChatOpen(true);
  };

  const handleCreateGroup = () => {
    loadUserGroups();
  };

  const openGroupSettings = (group: any) => {
    setSelectedGroupForSettings(group);
    setSettingsOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Groups</h1>
          {!loading && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              {studyGroups.length === 0
                ? 'No groups yet — create or join one to get started'
                : `${studyGroups.length} group${studyGroups.length !== 1 ? 's' : ''} you're part of`}
            </p>
          )}
        </div>
        <CreateGroupDialog onGroupCreated={() => window.location.reload()} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 pointer-events-none" />
        <Input
          placeholder="Search by name, subject, or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400/20 transition-colors h-10"
        />
      </div>

      {/* Calendar dashboard */}
      <GroupsDashboard />

      {/* Groups grid */}
      <GroupsGrid
        filteredGroups={filteredGroups}
        loading={loading}
        error={error}
        searchTerm={searchTerm}
        isAnonymousUser={isAnonymousUser()}
        currentUserId={user?.id}
        openGroupPage={openGroupPage}
        openGroupSettings={openGroupSettings}
        openChat={openChat}
        openGroupDetails={openGroupDetails}
        handleJoinGroup={handleJoinGroup}
        handleLeaveGroup={handleLeaveGroup}
        handleCreateGroup={handleCreateGroup}
      />

      {selectedGroupDetails && (
        <GroupDetails
          group={selectedGroupDetails}
          onClose={() => setSelectedGroupDetails(null)}
          onOpenChat={(groupName, groupId) => {
            openChat(groupName, groupId);
            setSelectedGroupDetails(null);
          }}
        />
      )}

      <GroupSettingsDialog
        group={selectedGroupForSettings}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onGroupUpdated={handleGroupUpdated}
        onGroupDeleted={handleGroupDeleted}
      />

      <ChatPopup
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          loadUserGroups();
        }}
        groupName={selectedGroupName}
        groupId={selectedGroupId}
      />
    </div>
  );
};
