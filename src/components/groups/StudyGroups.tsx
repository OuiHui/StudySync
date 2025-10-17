
import { useState } from 'react';
import { Users, Crown, Calendar, MessageSquare, Settings, BookOpen, Search, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudyCalendar } from '@/components/calendar/StudyCalendar';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { GroupManagement } from '@/components/groups/GroupManagement';
import { GroupDetails } from '@/components/groups/GroupDetails';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';

interface StudyGroupsProps {
  onSelectGroup?: (groupId: string) => void;
}

export const StudyGroups = ({ onSelectGroup }: StudyGroupsProps) => {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [studyGroups, setStudyGroups] = useState([
    {
      id: '1',
      name: 'Advanced Mathematics',
      subject: 'Calculus & Linear Algebra',
      members: 12,
      role: 'admin',
      nextSession: '2024-01-15 14:00',
      description: 'A comprehensive study group focused on advanced mathematical concepts including multivariable calculus, linear algebra, and differential equations. We meet twice weekly to work through problem sets and discuss challenging concepts.',
      fullDescription: 'This study group is designed for students taking advanced mathematics courses. We cover topics such as integration techniques, series convergence, vector spaces, eigenvalues, and linear transformations. Our sessions include collaborative problem-solving, concept discussions, and exam preparation. Members are expected to come prepared with questions and to actively participate in discussions.',
      color: 'bg-blue-500',
      recentActivity: 'Sarah shared new calculus notes 2 hours ago',
      meetingSchedule: 'Tuesdays & Thursdays, 2:00 PM - 4:00 PM',
      requirements: 'Calculus I & II prerequisites',
      studyMaterials: ['Stewart Calculus 8th Edition', 'Linear Algebra by Lay', 'Khan Academy videos']
    },
    {
      id: '2',
      name: 'Physics Study Circle',
      subject: 'Quantum Mechanics',
      members: 8,
      role: 'member',
      nextSession: '2024-01-16 16:30',
      description: 'Deep dive into quantum physics principles and applications',
      color: 'bg-purple-500',
      recentActivity: 'New session scheduled for tomorrow'
    },
    {
      id: '3',
      name: 'Chemistry Lab Prep',
      subject: 'Organic Chemistry',
      members: 15,
      role: 'moderator',
      nextSession: '2024-01-17 19:00',
      description: 'Preparation for upcoming laboratory experiments',
      color: 'bg-green-500',
      recentActivity: 'John uploaded lab procedure notes'
    }
  ]);

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

  const handleCreateGroup = (newGroup: any) => {
    setStudyGroups(prev => [...prev, newGroup]);
  };

  const handleJoinGroup = (groupId: string) => {
    console.log('Joining group:', groupId);
    // In a real app, this would make an API call
  };

  const handleLeaveGroup = (groupId: string) => {
    setStudyGroups(prev => prev.filter(group => group.id !== groupId));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Study Groups</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Collaborate and learn together</p>
        </div>
        <CreateGroupDialog onGroupCreated={() => window.location.reload()} />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search groups by name, subject, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Section - spans 2 columns */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800 dark:text-white">
                <Calendar size={20} className="mr-2 text-blue-600" />
                Group Study Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudyCalendar compact={true} />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events - spans 1 column */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-white">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Advanced Mathematics</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Today, 2:00 PM</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Physics Study Circle</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tomorrow, 4:30 PM</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Chemistry Lab Prep</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wednesday, 7:00 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Group Activity and Stats - spans 1 column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-white">Recent Group Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">New member joined Advanced Mathematics</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Study session scheduled in Physics Study Circle</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <BookOpen size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Notes shared in Chemistry Lab Prep</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="border-0 shadow-md dark:bg-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active Groups</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md dark:bg-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">35</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Members</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md dark:bg-gray-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Sessions This Week</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Study Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card 
            key={group.id} 
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer dark:bg-gray-800"
            onClick={() => openGroupPage(group.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${group.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Users size={24} className="text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  {group.role === 'admin' && (
                    <Crown size={16} className="text-yellow-500" />
                  )}
                  <Settings size={16} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100" />
                </div>
              </div>
              <CardTitle className="text-lg text-gray-800 dark:text-white">{group.name}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300">{group.subject}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{group.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Members</span>
                  <span className="font-medium text-gray-800 dark:text-white">{group.members}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar size={14} className="mr-2" />
                  <span>Next: Jan 15, 2:00 PM</span>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-start">
                    <MessageSquare size={14} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-gray-600 dark:text-gray-300">{group.recentActivity}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    openChat(group.name);
                  }}
                >
                  <MessageSquare size={14} className="mr-1" />
                  Chat
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveGroup(group.id);
                  }}
                >
                  <UserMinus size={14} className="mr-1" />
                  Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show message when no groups match search */}
      {filteredGroups.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No groups found matching "{searchTerm}"</p>
        </div>
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


      <ChatPopup
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        groupName={selectedGroupName}
      />
    </div>
  );
};
