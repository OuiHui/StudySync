import { useState, useEffect } from 'react';
import { Users, Crown, Calendar, MessageSquare, Settings, BookOpen, Search, UserMinus, TrendingUp, Clock, Star, Loader2, Calculator, Atom, Code, Globe, Music, Camera, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudyCalendar } from '@/components/calendar/StudyCalendar';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { GroupDetails } from '@/components/groups/GroupDetails';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface StudyGroupsProps {
  onSelectGroup?: (groupId: string) => void;
}

export const StudyGroups = ({ onSelectGroup }: StudyGroupsProps) => {
  const { user, session } = useAuth();
  
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<any | null>(null);

  // Helper function to get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Users,
      BookOpen,
      Calculator,
      Atom,
      Code,
      Globe,
      Music,
      Camera,
      Heart,
      Star,
      Zap
    };
    return iconMap[iconName] || Users;
  };

  // Helper function to get icon component by name or render custom image
  const renderGroupIcon = (iconValue: string, size: number = 20, className: string = "text-white drop-shadow-sm") => {
    // Check if it's a custom image (data URI or URL)
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
    
    // Otherwise, use icon from library
    const IconComponent = getIconComponent(iconValue);
    return <IconComponent size={size} className={className} />;
  };

  // Helper function to convert old color format to gradient format
  const normalizeColor = (color: string) => {
    if (!color) return 'from-blue-500 to-blue-600';
    
    // If it's already a gradient, return as is
    if (color.includes('from-') && color.includes('to-')) {
      return color;
    }
    
    // Convert old single color format to gradient
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
      'bg-cyan-500': 'from-cyan-500 to-cyan-600'
    };
    
    // Handle direct color names without 'bg-' prefix
    const directColorMap: { [key: string]: string } = {
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
    
    return colorMap[color] || directColorMap[color] || 'from-blue-500 to-blue-600';
  };

  // Helper function to check if user is anonymous
  const isAnonymousUser = () => {
    return !user || !user.email || user.is_anonymous === true || user.aud === 'anonymous';
  };

  // Mock current user ID - in a real app, this would come from auth context
  // const currentUserId = 'current-user-id';

  useEffect(() => {
    loadUserGroups();
  }, [user]); // Also reload when user changes

  const loadUserGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated and not anonymous
      const isAnonymous = isAnonymousUser();
      
      if (isAnonymous) {
        console.log('Anonymous user, showing public groups instead');
        // For anonymous users, show public groups
        const publicGroups = await StudyGroupsService.getPublicGroups();
        
        // Transform public groups to match our component structure
        const transformedGroups = publicGroups.map((group: any) => {
          return {
            id: group.id,
            name: group.name,
            subject: group.subject || 'General',
            members: group.member_count || 0,
            role: 'visitor', // Anonymous users are visitors
            nextSession: null,
            description: group.description || '',
            color: group.color || 'from-blue-500 to-blue-600', // Use database value or default
            icon: group.icon || 'Users', // Use database value or default
            recentActivity: 'Public group',
            created_at: group.created_at,
            is_public: group.is_public,
            creator_profile: group.creator_profile
          };
        });
        
        setStudyGroups(transformedGroups);
        return;
      }
      
      const data = await StudyGroupsService.getUserGroups();
      
      // Transform the data to match our component structure
      const transformedGroups = data.map((group: any) => {
        return {
          id: group.id,
          name: group.name,
          subject: group.subject || 'General',
          members: 0, // We'll need to count this from group_members separately
          user_role: group.user_role || 'member', // Keep as user_role for consistency
          nextSession: null, // This would come from study_sessions
          description: group.description || '',
          color: group.color || 'from-blue-500 to-blue-600', // Use database value or default
          icon: group.icon || 'Users', // Use database value or default
          recentActivity: 'No recent activity',
          created_at: group.created_at,
          created_by: group.created_by, // Include created_by for admin check
          is_public: group.is_public
        };
      });
      
      setStudyGroups(transformedGroups);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Unable to load study groups. This might be due to database access restrictions or you may not be a member of any groups yet.');
    } finally {
      setLoading(false);
    }
  };

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

  const openChat = (groupName: string) => {
    setSelectedGroupName(groupName);
    setChatOpen(true);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      // Check if user is anonymous
      const isAnonymous = isAnonymousUser();
      
      if (isAnonymous) {
        // Redirect to auth page for anonymous users
        window.location.href = '/auth';
        return;
      }
      
      await StudyGroupsService.joinGroup(groupId);
      loadUserGroups(); // Reload groups after joining
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await StudyGroupsService.leaveGroup(groupId);
      loadUserGroups(); // Reload groups after leaving
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  };

  const handleCreateGroup = () => {
    loadUserGroups(); // Reload groups after creating
  };

  const openGroupSettings = (group: any) => {
    setSelectedGroupForSettings(group);
    setSettingsOpen(true);
  };

  const handleGroupUpdated = (updatedGroup: any) => {
    console.log('Updating group in UI:', updatedGroup);
    setStudyGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === updatedGroup.id 
          ? { 
              ...group, 
              ...updatedGroup,
              color: updatedGroup.color || group.color || 'from-blue-500 to-blue-600',
              icon: updatedGroup.icon || group.icon || 'Users'
            }
          : group
      )
    );
  };

  const handleGroupDeleted = (groupId: string) => {
    setStudyGroups(prevGroups => 
      prevGroups.filter(group => group.id !== groupId)
    );
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Section - spans 8 columns */}
          <div className="lg:col-span-8">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-gray-800 dark:text-white text-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Calendar size={18} className="text-white" />
                  </div>
                  Group Study Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudyCalendar compact={true} />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - spans 4 columns */}
          <div className="lg:col-span-4">
            {/* Recent Activity */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 h-full flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="flex items-center text-gray-800 dark:text-white text-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp size={18} className="text-white" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-4 scrollbar-hide"
                     style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">New member joined Advanced Mathematics</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                      <Calendar size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Study session scheduled in Physics Study Circle</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <BookOpen size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Notes shared in Chemistry Lab Prep</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">6 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
                      <MessageSquare size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Message posted in Computer Science Study Group</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">8 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                      <Star size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Assignment completed in Biology Lab</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">12 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Study Groups Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isAnonymousUser() ? 'Public Study Groups' : 'My Study Groups'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {loading ? 'Loading...' : `${filteredGroups.length} groups found`}
            </p>
          </div>

          {/* Temporary notice about current limitations */}
          {!isAnonymousUser() && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Currently showing groups you created
                  </h3>
                  <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    <p>Due to database configuration issues, only groups you've created are shown. Groups you've joined will be available once the database policies are updated.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading study groups...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={loadUserGroups} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                {searchTerm 
                  ? 'No groups match your search' 
                  : isAnonymousUser()
                    ? 'No public groups available'
                    : 'No study groups yet'
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : isAnonymousUser()
                    ? 'Sign up or log in to create and join study groups with other students'
                    : 'Join or create a study group to get started'
                }
              </p>
              {!searchTerm && !isAnonymousUser() && (
                <CreateGroupDialog onGroupCreated={handleCreateGroup} />
              )}
              {isAnonymousUser() && (
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
                // More robust admin checking
                const currentUserId = user?.id;
                const groupCreatorId = group.created_by;
                const userRole = group.user_role;
                
                // Check multiple conditions for admin status
                const isCreator = currentUserId && groupCreatorId && currentUserId === groupCreatorId;
                const isAdminRole = userRole === 'admin';
                const isAdmin = isCreator || isAdminRole;
                
                return (
                <Card 
                  key={group.id} 
                  className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:scale-105 overflow-hidden"
                  onClick={() => openGroupPage(group.id)}
                >
                  {/* Card Header with Gradient */}
                  <div className={`h-24 bg-gradient-to-br ${normalizeColor(group.color)} to-opacity-80 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
                      {/* Admin Crown Icon */}
                      {isAdmin && (
                        <div className="bg-yellow-400 p-1.5 rounded-full shadow-lg z-20 border-2 border-yellow-300">
                          <Crown size={14} className="text-yellow-800" />
                        </div>
                      )}
                      
                      {/* Settings Button for Admins */}
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
                      {/* Title and Subject */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{group.subject}</p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {group.description || 'No description available'}
                      </p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 py-3">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800 dark:text-white">{group.members}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Members</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800 dark:text-white">
                            {group.is_public ? 'Public' : 'Private'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Visibility</div>
                        </div>
                      </div>
                      
                      {/* Next Session */}
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
                      
                      {/* Recent Activity */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border-l-3 border-blue-500">
                        <div className="flex items-start">
                          <MessageSquare size={14} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            {group.recentActivity}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-6 flex space-x-2">
                      {group.user_role === 'visitor' ? (
                        // Anonymous user viewing public groups
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
                        // Authenticated user's groups
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              openChat(group.name);
                            }}
                          >
                            <MessageSquare size={14} className="mr-1" />
                            Chat
                          </Button>
                          {!isAdmin && (
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

        {/* Show message when no groups match search */}
        {filteredGroups.length === 0 && searchTerm && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No groups found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                No groups found matching "{searchTerm}". Try adjusting your search terms.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

      {selectedGroupDetails && (
        <GroupDetails
          group={selectedGroupDetails}
          onClose={() => setSelectedGroupDetails(null)}
          onOpenChat={(groupName) => {
            openChat(groupName);
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
      />
      </div>
    </div>
  );
};
