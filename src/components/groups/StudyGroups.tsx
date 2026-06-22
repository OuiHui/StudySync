import { useState } from 'react';
import { Users, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    loadUserGroups(); // Reload groups after creating
  };

  const openGroupSettings = (group: any) => {
    setSelectedGroupForSettings(group);
    setSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section with Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  Study Groups
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Collaborate and learn together with your peers</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">{studyGroups.length} Groups Joined</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={14} className="text-blue-500" />
                <span className="text-gray-600 dark:text-gray-300">85% Weekly Activity</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <CreateGroupDialog onGroupCreated={() => window.location.reload()} />
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardContent className="p-6">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search groups by name, subject, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-0 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 transition-colors"
              />
            </div>
            
            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900">
                Mathematics
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900">
                Physics
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900">
                Chemistry
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900">
                Computer Science
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Grid */}
        <GroupsDashboard />

        {/* Study Groups Grid */}
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
    </div>
  );
};
