import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupInfo } from '@/hooks/useUserGroups';
import { GroupCard } from './GroupCard';

interface GroupsGridProps {
  filteredGroups: GroupInfo[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  isAnonymousUser: boolean;
  currentUserId?: string;
  openGroupPage: (groupId: string) => void;
  openGroupSettings: (group: GroupInfo) => void;
  openChat: (groupName: string, groupId: string) => void;
  openGroupDetails: (group: GroupInfo) => void;
  handleJoinGroup: (groupId: string) => void;
  handleLeaveGroup: (groupId: string) => void;
  handleCreateGroup: () => void;
}

export const GroupsGrid = ({
  filteredGroups,
  loading,
  error,
  searchTerm,
  isAnonymousUser,
  currentUserId,
  openGroupPage,
  openGroupSettings,
  openChat,
  openGroupDetails,
  handleJoinGroup,
  handleLeaveGroup,
  handleCreateGroup,
}: GroupsGridProps) => {

  return (
    <div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Loading your groups…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400 mb-1 font-medium">{error}</p>
          <p className="text-sm text-gray-400 mb-4">Something went wrong loading your groups</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">
            Try Again
          </Button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
            <Users className="h-7 w-7 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            {searchTerm 
              ? 'No groups match your search' 
              : isAnonymousUser
                ? 'No public groups available'
                : 'No study groups yet'
            }
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : isAnonymousUser
                ? 'Sign up or log in to create and join study groups with other students'
                : 'Create your first group or browse available groups to get started'
            }
          </p>
          {!searchTerm && !isAnonymousUser && (
            <CreateGroupDialog onGroupCreated={handleCreateGroup} />
          )}
          {isAnonymousUser && (
            <div className="flex gap-3">
              <Button onClick={() => window.location.href = '/auth'} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                Sign Up
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/auth'} className="rounded-xl">
                Log In
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isMyGroupPage={true}
              currentUserId={currentUserId}
              onClick={() => openGroupPage(group.id)}
              openGroupSettings={openGroupSettings}
              openChat={openChat}
            />
          ))}
        </div>
      )}

    </div>
  );
};
