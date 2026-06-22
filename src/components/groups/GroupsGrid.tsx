import { Users, Crown, Settings, BookOpen, MessageSquare, UserMinus, Calendar, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, ArrowRight } from 'lucide-react';
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
          {filteredGroups.map((group) => {
            const groupCreatorId = group.created_by;
            const userRole = group.user_role;
            
            const isCreator = currentUserId && groupCreatorId && currentUserId === groupCreatorId;
            const isAdminRole = userRole === 'admin';
            const isAdmin = isCreator || isAdminRole;
            
            return (
            <Card
              key={group.id}
              className="group/card border border-gray-100 dark:border-gray-700/50 shadow-none hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 cursor-pointer bg-white dark:bg-gray-900 overflow-hidden rounded-2xl hover:border-gray-200 dark:hover:border-gray-600"
              onClick={() => openGroupPage(group.id)}
            >
              {/* Gradient banner */}
              <div className={`h-24 bg-gradient-to-br ${normalizeColor(group.color)} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_60%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                
                {/* Top-right badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  {isAdmin && (
                    <div className="bg-yellow-400/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-yellow-300/50" title="Admin">
                      <Crown size={12} className="text-yellow-800" />
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      className="bg-white/20 backdrop-blur-md p-1.5 rounded-full hover:bg-white/40 transition-all duration-200 z-20 border border-white/10 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGroupSettings(group);
                      }}
                      title="Group Settings"
                    >
                      <Settings size={12} className="text-white drop-shadow-sm" />
                    </button>
                  )}
                </div>

                {/* Icon */}
                <div className="absolute bottom-3 left-4 z-10">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    {renderGroupIcon(group.icon || 'Users', 18, "text-white drop-shadow-sm")}
                  </div>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="space-y-3">
                  {/* Title & subject */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors leading-tight">
                      {group.name}
                    </h3>
                    {group.subject && (
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wide">{group.subject}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {group.description || 'No description available'}
                  </p>
                  
                  {/* Meta badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                      <Users size={11} />
                      {group.members} {group.members === 1 ? 'member' : 'members'}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      group.is_public
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {group.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  
                  {/* Next session */}
                  {group.nextSession && (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-50/70 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                      <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">Next Session</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {new Date(group.nextSession).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Recent activity */}
                  {group.recentActivity && (
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <MessageSquare size={12} className="text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">
                        {group.recentActivity}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex gap-2">
                  {group.user_role === 'visitor' || group.role === 'visitor' ? (
                    <>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(group.id);
                        }}
                      >
                        <Users size={13} className="mr-1.5" />
                        Join Group
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGroupDetails(group);
                        }}
                      >
                        <BookOpen size={13} className="mr-1.5" />
                        View
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(group.name, group.id);
                        }}
                      >
                        <MessageSquare size={13} className="mr-1.5" />
                        Chat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl text-xs h-9 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGroupPage(group.id);
                        }}
                      >
                        <ArrowRight size={14} />
                      </Button>
                      {!isCreator && (
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-xs h-9 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveGroup(group.id);
                          }}
                          title="Leave group"
                        >
                          <UserMinus size={14} />
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
