
import { useState, useEffect } from 'react';
import { Users, Search, BookOpen, Calendar, ArrowRight, UserPlus, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StudyGroupsBrowseProps {
  onSelectGroup: (groupId: string) => void;
  groupEnrollments?: Record<string, boolean>;
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void;
}

export const StudyGroupsBrowse = ({ onSelectGroup, groupEnrollments = {}, onUpdateEnrollment }: StudyGroupsBrowseProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const subjects = [
    'all',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'Literature',
    'Psychology',
    'Economics'
  ];

  const [availableGroups, setAvailableGroups] = useState([
    {
      id: '1',
      name: 'Advanced Mathematics',
      subject: 'Mathematics',
      description: 'Deep dive into calculus and linear algebra',
      members: 12,
      admin: 'Sarah Johnson',
      sessions: 8,
      isEnlisted: groupEnrollments['1'] !== undefined ? groupEnrollments['1'] : true,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: 'Quantum Physics Study',
      subject: 'Physics',
      description: 'Exploring quantum mechanics principles',
      members: 8,
      admin: 'Dr. Smith',
      sessions: 5,
      isEnlisted: groupEnrollments['2'] !== undefined ? groupEnrollments['2'] : false,
      color: 'bg-purple-500'
    },
    {
      id: '3',
      name: 'Organic Chemistry Lab',
      subject: 'Chemistry',
      description: 'Hands-on chemistry experiments and theory',
      members: 15,
      admin: 'Prof. Wilson',
      sessions: 12,
      isEnlisted: groupEnrollments['3'] !== undefined ? groupEnrollments['3'] : false,
      color: 'bg-green-500'
    },
    {
      id: '4',
      name: 'Data Structures & Algorithms',
      subject: 'Computer Science',
      description: 'Master programming fundamentals',
      members: 20,
      admin: 'Alex Chen',
      sessions: 10,
      isEnlisted: groupEnrollments['4'] !== undefined ? groupEnrollments['4'] : true,
      color: 'bg-orange-500'
    },
    {
      id: '5',
      name: 'World History Discussion',
      subject: 'History',
      description: 'Analyzing historical events and patterns',
      members: 7,
      admin: 'Maria Garcia',
      sessions: 6,
      isEnlisted: groupEnrollments['5'] !== undefined ? groupEnrollments['5'] : false,
      color: 'bg-red-500'
    }
  ]);

  // Update enrollment status when groupEnrollments prop changes
  useEffect(() => {
    setAvailableGroups(prev => 
      prev.map(group => ({
        ...group,
        isEnlisted: groupEnrollments[group.id] !== undefined ? groupEnrollments[group.id] : group.isEnlisted
      }))
    );
  }, [groupEnrollments]);

  const filteredGroups = availableGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || group.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleJoinGroup = (groupId: string) => {
    setAvailableGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isEnlisted: true, members: group.members + 1 }
          : group
      )
    );
    onUpdateEnrollment?.(groupId, true);
  };

  const handleLeaveGroup = (groupId: string) => {
    setAvailableGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isEnlisted: false, members: group.members - 1 }
          : group
      )
    );
    onUpdateEnrollment?.(groupId, false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Browse Study Groups</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Find and join study groups by subject</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>
              {subject === 'all' ? 'All Subjects' : subject}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredGroups.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Available Groups</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredGroups.filter(g => g.isEnlisted).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Joined</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {subjects.length - 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Subjects</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {filteredGroups.reduce((sum, g) => sum + g.members, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Members</div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card 
            key={group.id}
            className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer dark:bg-gray-800"
            onClick={() => onSelectGroup(group.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${group.color} rounded-lg flex items-center justify-center mb-3`}>
                  <BookOpen size={24} className="text-white" />
                </div>
                {group.isEnlisted && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Joined
                  </span>
                )}
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
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Sessions</span>
                  <span className="font-medium text-gray-800 dark:text-white">{group.sessions}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Admin</span>
                  <span className="font-medium text-gray-800 dark:text-white">{group.admin}</span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Button 
                  variant="outline"
                  className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGroup(group.id);
                  }}
                >
                  <ArrowRight size={14} className="mr-1" />
                  View Details
                </Button>
                {group.isEnlisted ? (
                  <Button 
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveGroup(group.id);
                    }}
                  >
                    <UserMinus size={14} className="mr-1" />
                    Leave
                  </Button>
                ) : (
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(group.id);
                    }}
                  >
                    <UserPlus size={14} className="mr-1" />
                    Join
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No groups found matching your criteria</p>
        </div>
      )}
    </div>
  );
};
