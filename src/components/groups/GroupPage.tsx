import { useState } from 'react';
import { Users, Calendar, BookOpen, MessageSquare, ArrowLeft, Settings, Crown, UserMinus, UserCheck, UserX, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';

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
  const [attendingSessions, setAttendingSessions] = useState<string[]>(['1']); // Initially attending session 1
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Mock data - in real app this would come from props or API
  const group = {
    id: groupId,
    name: 'Advanced Mathematics',
    subject: 'Calculus & Linear Algebra',
    description: 'A comprehensive study group focused on advanced mathematical concepts including multivariable calculus, linear algebra, and differential equations.',
    admin: 'Sarah Johnson',
    members: 12,
    color: 'bg-purple-500',
    icon: 'Calculator',
    is_public: true,
    max_members: 20,
    member_count: 12,
    created_at: '2024-01-10T00:00:00Z',
    user_role: 'admin' // Current user is admin of this group
  };

  const sessions = [
    {
      id: '1',
      title: 'Integration Techniques',
      date: '2024-01-15',
      time: '14:00',
      duration: '2 hours',
      attendees: 8,
      type: 'active' as const
    },
    {
      id: '2',
      title: 'Linear Transformations',
      date: '2024-01-17',
      time: '16:00',
      duration: '1.5 hours',
      attendees: 10,
      type: 'planned' as const
    },
    {
      id: '3',
      title: 'Eigenvalues and Eigenvectors',
      date: '2024-01-20',
      time: '14:00',
      duration: '2 hours',
      attendees: 9,
      type: 'planned' as const
    }
  ];

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
      detail: { sessionId, groupName: group.name, attending: true }
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
          <div className={`w-12 h-12 ${group.color} rounded-lg flex items-center justify-center`}>
            {(() => {
              const IconComponent = getIconComponent(group.icon || 'Users');
              return <IconComponent size={24} className="text-white" />;
            })()}
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

      {/* Tabs */}
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

      {/* Tab Content */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
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

      {/* Chat Popup */}
      <ChatPopup
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        groupName={group.name}
      />

      {/* Group Settings Dialog */}
      <GroupSettingsDialog
        group={group}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onGroupUpdated={handleGroupUpdated}
        onGroupDeleted={handleGroupDeleted}
      />
    </div>
  );
};
