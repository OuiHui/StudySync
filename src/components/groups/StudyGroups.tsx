import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { GroupDetails } from '@/components/groups/GroupDetails';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { GroupFilterBar, GroupFilterState } from '@/components/groups/GroupFilterBar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserGroups } from '@/hooks/useUserGroups';
import { GroupsGrid } from '@/components/groups/GroupsGrid';
import { PAGE_TITLE_CLASS } from '@/constants/theme';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<any | null>(null);

  const [filters, setFilters] = useState<GroupFilterState>({
    searchTerm: '',
    selectedSubject: 'all',
    selectedVisibility: 'all',
    sortBy: 'name_asc',
  });

  const availableSubjects = useMemo(() => {
    const subjects = studyGroups
      .map((g) => g.subject?.trim())
      .filter((s): s is string => Boolean(s));
    return Array.from(new Set(subjects)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [studyGroups]);

  const filteredGroups = useMemo(() => {
    const searchLower = filters.searchTerm.toLowerCase().trim();

    return studyGroups
      .filter((group) => {
        const matchesSearch =
          !searchLower ||
          (group.name || '').toLowerCase().includes(searchLower) ||
          (group.subject || '').toLowerCase().includes(searchLower) ||
          (group.description || '').toLowerCase().includes(searchLower);

        const matchesSubject =
          filters.selectedSubject === 'all' ||
          (group.subject || '').trim().toLowerCase() === filters.selectedSubject.trim().toLowerCase();

        const matchesVisibility =
          filters.selectedVisibility === 'all' ||
          (filters.selectedVisibility === 'public' ? group.is_public : !group.is_public);

        return matchesSearch && matchesSubject && matchesVisibility;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'members_desc') {
          return ((b as any).member_count || 0) - ((a as any).member_count || 0);
        }
        if (filters.sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });
  }, [studyGroups, filters]);

  const handleFilterChange = (updates: Partial<GroupFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      selectedSubject: 'all',
      selectedVisibility: 'all',
      sortBy: 'name_asc',
    });
  };

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
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <GroupFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableSubjects={availableSubjects}
        onReset={handleResetFilters}
        disabled={loading}
      />

      {/* Groups grid */}
      <GroupsGrid
        filteredGroups={filteredGroups}
        loading={loading}
        error={error}
        searchTerm={filters.searchTerm}
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
