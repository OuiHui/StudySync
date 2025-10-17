import { useState, useEffect } from 'react';
import { Users, Calendar, BookOpen, MessageSquare, ArrowLeft, Settings, Crown, UserMinus, UserCheck, UserX, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { CollaborativeNotes } from '@/components/notes/CollaborativeNotes';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { StudySessionsService, StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface GroupPageProps {
  groupId: string;
  onBack: () => void;
  isEnlisted?: boolean;
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void;
}

export const GroupPage = ({ groupId, onBack, isEnlisted = true, onUpdateEnrollment }: GroupPageProps) => {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [enrolled, setEnrolled] = useState(isEnlisted);
  const [attendingSessions, setAttendingSessions] = useState<string[]>(['1']); // Initially attending session 1
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // State for real data
  const [sessions, setSessions] = useState<any[]>([]);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load group data and sessions
  useEffect(() => {
    loadGroupData();
    loadGroupSessions();
  }, [groupId, user]);

  const loadGroupData = async () => {
    try {
      const groupData = await StudyGroupsService.getGroupById(groupId);
      setGroup(groupData);
    } catch (err) {
      console.error('Error loading group data:', err);
      setError('Failed to load group data');
    }
  };

  const loadGroupSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const groupSessions = await StudySessionsService.getSessionsByGroup(groupId);
      setSessions(groupSessions);
    } catch (err) {
      console.error('Error loading group sessions:', err);
      setError('Failed to load group sessions');
    } finally {
      setLoading(false);
    }
  };

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

  // Helper function to render icon (library icon or custom image)
  const renderGroupIcon = (iconValue: string, size: number = 24, className: string = "text-white") => {
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

  // Mock data for notes and members - in real app this would come from props or API
  const notes = [
    {
      id: '1',
      title: 'Calculus Review Notes',
      author: 'Sarah Johnson',
      date: '2024-01-10',
      subject: 'Mathematics'
    },
    {
      id: '2',
      title: 'Linear Algebra Formulas',
      author: 'Mike Chen',
      date: '2024-01-12',
      subject: 'Mathematics'
    },
    {
      id: '3',
      title: 'Practice Problems Set 1',
      author: 'Emma Wilson',
      date: '2024-01-14',
      subject: 'Mathematics'
    }
  ];

  const members = [
    { id: '1', name: 'Sarah Johnson', role: 'Admin', avatar: 'SJ' },
    { id: '2', name: 'Mike Chen', role: 'Member', avatar: 'MC' },
    { id: '3', name: 'Emma Wilson', role: 'Member', avatar: 'EW' },
    { id: '4', name: 'John Smith', role: 'Member', avatar: 'JS' },
    { id: '5', name: 'Lisa Brown', role: 'Moderator', avatar: 'LB' }
  ];

  // Transform sessions data for display
  const displaySessions = sessions.map(session => ({
    ...session,
    id: session.id,
    title: session.title,
    date: new Date(session.scheduled_start).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }),
    time: new Date(session.scheduled_start).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    duration: session.duration_minutes ? `${session.duration_minutes} minutes` : '60 minutes',
    attendees: session.participant_count || 0,
    type: session.status === 'active' ? 'active' as const : 'planned' as const
  }));

  const handleLeaveGroup = () => {
    setEnrolled(false);
    onUpdateEnrollment?.(groupId, false);
    console.log('Left group:', groupId);
  };

  const handleJoinGroup = () => {
    setEnrolled(true);
    onUpdateEnrollment?.(groupId, true);
    console.log('Joined group:', groupId);
  };

  const handleAttendSession = (sessionId: string) => {
    setAttendingSessions(prev => [...prev, sessionId]);
    // Notify parent component about session attendance
    window.dispatchEvent(new CustomEvent('sessionAttendanceChanged', {
      detail: { sessionId, groupName: group?.name, attending: true }
    }));
  };

  const handleCancelSession = (sessionId: string) => {
    setAttendingSessions(prev => prev.filter(id => id !== sessionId));
    // Notify parent component about session cancellation
    window.dispatchEvent(new CustomEvent('sessionAttendanceChanged', {
      detail: { sessionId, groupName: group.name, attending: false }
    }));
  };

  const handleGroupUpdated = (updatedGroup: any) => {
    console.log('Group updated:', updatedGroup);
    // In a real app, you would update the group data
    // For now, just close the settings dialog
  };

  const handleGroupDeleted = (groupId: string) => {
    console.log('Group deleted:', groupId);
    // Navigate back to groups list since this group no longer exists
    onBack();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading group...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && group && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="dark:text-white dark:hover:bg-gray-700"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </Button>
              <div className={`w-12 h-12 ${group.color || 'bg-purple-500'} rounded-lg flex items-center justify-center`}>
                {renderGroupIcon(group.icon || 'Users', 24, "text-white")}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{group.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">{group.subject}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {enrolled && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm rounded-full">
                  Enrolled
                </span>
              )}
              <Button
                onClick={() => setChatOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <MessageSquare size={16} className="mr-1" />
                Group Chat
              </Button>
              {group.user_role === 'admin' && (
                <Button
                  onClick={() => setSettingsOpen(true)}
                  variant="outline"
                  className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                >
                  <Settings size={16} className="mr-1" />
                  Group Settings
                </Button>
              )}
              {enrolled ? (
                <Button
                  onClick={handleLeaveGroup}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <UserMinus size={16} className="mr-1" />
                  Leave Group
                </Button>
              ) : (
                <Button
                  onClick={handleJoinGroup}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <UserCheck size={16} className="mr-1" />
                  Join Group
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-700 dark:text-gray-300">{group.description}</p>
            </CardContent>
          </Card>
        </>
      )}
      
      {!loading && !error && group && (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {['sessions', 'notes', 'docs', 'members'].map((tab) => (
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

          {/* Tab Content */}
          {activeTab === 'sessions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displaySessions.map((session) => (
                <Card key={session.id} className="border-0 shadow-md dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 dark:text-white">{session.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{session.date} at {session.time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users size={14} className="mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{session.attendees} attendees</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Duration: {session.duration}</div>
                      
                      {session.type === 'planned' && (
                        <div className="flex items-center text-sm">
                          {attendingSessions.includes(session.id) ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center">
                              <UserCheck size={14} className="mr-1" />
                              Planning to attend
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Not attending</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {session.type === 'active' ? (
                      <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                        Join Session
                      </Button>
                    ) : (
                      <div className="mt-4 flex space-x-2">
                        {attendingSessions.includes(session.id) ? (
                          <Button 
                            onClick={() => handleCancelSession(session.id)}
                            variant="outline" 
                            className="flex-1 text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <UserX size={14} className="mr-1" />
                            Cancel
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleAttendSession(session.id)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          >
                            <UserCheck size={14} className="mr-1" />
                            Attend
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <Card key={note.id} className="border-0 shadow-md dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800 dark:text-white">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-300">By: {note.author}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Date: {note.date}</div>
                      <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                        {note.subject}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full mt-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                      <BookOpen size={14} className="mr-1" />
                      View Note
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="border-0 shadow-md dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{member.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-white">{member.name}</h3>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{member.role}</span>
                          {member.role === 'Admin' && (
                            <Crown size={14} className="ml-1 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'docs' && (
            <CollaborativeNotes groupId={group.id} groupName={group.name} />
          )}
        </>
      )}

      {/* Chat Popup */}
      {group && (
        <ChatPopup
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          groupName={group.name}
          groupId={group.id}
        />
      )}

      {/* Group Settings Dialog */}
      {group && (
        <GroupSettingsDialog
          group={group}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onGroupUpdated={handleGroupUpdated}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
    </div>
  );
};
