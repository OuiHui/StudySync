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
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Groups</h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {studyGroups.length === 0
                ? 'No groups yet'
                : `${studyGroups.length} group${studyGroups.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <CreateGroupDialog onGroupCreated={() => window.location.reload()} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search by name, subject, or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 dark:bg-gray-800 dark:border-gray-700"
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
        onClose={() => setChatOpen(false)}
        groupName={selectedGroupName}
        groupId={selectedGroupId}
      />
    </div>
  );
};
