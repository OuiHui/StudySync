import { Users, Crown, Settings, BookOpen, MessageSquare, UserMinus, Search, Calendar, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupInfo } from '@/hooks/useUserGroups';

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

  // Helper function to get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Users, BookOpen, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap
    };
    return iconMap[iconName] || Users;
  };

  // Helper function to get icon component by name or render custom image
  const renderGroupIcon = (iconValue: string, size: number = 20, className: string = "text-white drop-shadow-sm") => {
    if (iconValue && (iconValue.startsWith('data:') || iconValue.startsWith('http'))) {
      return (
        <img 
          src={iconValue} 
          alt="Group icon" 
          className="object-cover rounded"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }
    const IconComponent = getIconComponent(iconValue);
    return <IconComponent size={size} className={className} />;
  };

  // Helper function to convert old color format to gradient format
  const normalizeColor = (color: string) => {
    if (!color) return 'from-blue-500 to-blue-600';
    if (color.includes('from-') && color.includes('to-')) {
      return color;
    }
    const colorMap: { [key: string]: string } = {
      'bg-blue-500': 'from-blue-500 to-blue-600',
      'bg-purple-500': 'from-purple-500 to-purple-600',
      'bg-green-500': 'from-green-500 to-green-600',
      'bg-red-500': 'from-red-500 to-red-600',
      'bg-orange-500': 'from-orange-500 to-orange-600',
      'bg-pink-500': 'from-pink-500 to-pink-600',
      'bg-indigo-500': 'from-indigo-500 to-indigo-600',
      'bg-teal-500': 'from-teal-500 to-teal-600',
      'bg-yellow-500': 'from-yellow-500 to-yellow-600',
      'bg-cyan-500': 'from-cyan-500 to-cyan-600',
      'blue': 'from-blue-500 to-blue-600',
      'purple': 'from-purple-500 to-purple-600',
      'green': 'from-green-500 to-green-600',
      'red': 'from-red-500 to-red-600',
      'orange': 'from-orange-500 to-orange-600',
      'pink': 'from-pink-500 to-pink-600',
      'indigo': 'from-indigo-500 to-indigo-600',
      'teal': 'from-teal-500 to-teal-600',
      'yellow': 'from-yellow-500 to-yellow-600',
      'cyan': 'from-cyan-500 to-cyan-600'
    };
    return colorMap[color] || 'from-blue-500 to-blue-600';
  };

  return (
    <div>
      
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {searchTerm 
              ? 'No groups match your search' 
              : isAnonymousUser
                ? 'No public groups available'
                : 'No study groups yet'
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : isAnonymousUser
                ? 'Sign up or log in to create and join study groups with other students'
                : 'Join or create a study group to get started'
            }
          </p>
          {!searchTerm && !isAnonymousUser && (
            <CreateGroupDialog onGroupCreated={handleCreateGroup} />
          )}
          {isAnonymousUser && (
            <div className="space-x-3">
              <Button onClick={() => window.location.href = '/auth'} className="bg-blue-600 hover:bg-blue-700">
                Sign Up
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Log In
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const groupCreatorId = group.created_by;
            const userRole = group.user_role;
            
            const isCreator = currentUserId && groupCreatorId && currentUserId === groupCreatorId;
            const isAdminRole = userRole === 'admin';
            const isAdmin = isCreator || isAdminRole;
            
            return (
            <Card
              key={group.id}
              className="group border border-gray-100 dark:border-gray-700/60 shadow-none hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white dark:bg-gray-900 overflow-hidden"
              onClick={() => openGroupPage(group.id)}
            >
              <div className={`h-24 bg-gradient-to-br ${normalizeColor(group.color)} to-opacity-80 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
                  {isAdmin && (
                    <div className="bg-yellow-400 p-1.5 rounded-full shadow-lg z-20 border-2 border-yellow-300">
                      <Crown size={14} className="text-yellow-800" />
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      className="bg-white/30 p-1.5 rounded-full backdrop-blur-sm hover:bg-white/50 transition-all duration-200 z-20 border border-white/20 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGroupSettings(group);
                      }}
                      title="Group Settings"
                    >
                      <Settings size={14} className="text-white drop-shadow-sm" />
                    </button>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    {renderGroupIcon(group.icon || 'Users', 20, "text-white drop-shadow-sm")}
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{group.subject}</p>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {group.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Users size={12} />
                      {group.members} {group.members === 1 ? 'member' : 'members'}
                    </span>
                    <span className="text-gray-200 dark:text-gray-700">·</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      group.is_public
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {group.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  
                  {group.nextSession && (
                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Calendar size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Next Session</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(group.nextSession).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border-l-3 border-blue-500">
                    <div className="flex items-start">
                      <MessageSquare size={14} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {group.recentActivity}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-2">
                  {group.user_role === 'visitor' || group.role === 'visitor' ? (
                    <>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(group.id);
                        }}
                      >
                        <Users size={14} className="mr-1" />
                        Join Group
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGroupDetails(group);
                        }}
                      >
                        <BookOpen size={14} className="mr-1" />
                        View
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(group.name, group.id);
                        }}
                      >
                        <MessageSquare size={14} className="mr-1" />
                        Chat
                      </Button>
                      {!isCreator && (
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveGroup(group.id);
                          }}
                        >
                          <UserMinus size={14} className="mr-1" />
                          Leave
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
