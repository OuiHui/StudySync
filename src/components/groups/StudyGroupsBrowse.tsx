import { useState } from 'react';
import { Users, Search, BookOpen, ArrowRight, UserPlus, UserMinus, Loader2, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicGroups } from '@/hooks/usePublicGroups';

interface StudyGroupsBrowseProps {
  onSelectGroup: (groupId: string) => void;
  groupEnrollments?: Record<string, boolean>;
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void;
}

export const StudyGroupsBrowse = ({ onSelectGroup, groupEnrollments = {}, onUpdateEnrollment }: StudyGroupsBrowseProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  
  const {
    availableGroups,
    loading,
    error,
    loadPublicGroups,
    handleJoinGroup,
    handleLeaveGroup,
    handleCreateGroup,
  } = usePublicGroups(groupEnrollments, onUpdateEnrollment);

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Users, BookOpen, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap
    };
    return iconMap[iconName] || BookOpen;
  };

  const renderGroupIcon = (iconValue: string, size: number = 24, className: string = "text-white") => {
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

  const filteredGroups = availableGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || group.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Browse Study Groups</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Find and join study groups by subject</p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            disabled={loading}
          />
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
          disabled={loading}
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>
              {subject === 'all' ? 'All Subjects' : subject}
            </option>
          ))}
        </select>
        
        {user && (
          <CreateGroupDialog onGroupCreated={handleCreateGroup} />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading study groups...</span>
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => {
              const isCreator = user?.id === group.created_by;
              
              return (
                <Card 
                  key={group.id}
                  className="border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer dark:bg-gray-800"
                  onClick={() => onSelectGroup(group.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 ${group.color.includes('bg-gradient') ? group.color : group.color} rounded-lg flex items-center justify-center mb-3`}>
                        {renderGroupIcon(group.icon, 24, "text-white")}
                      </div>
                      {group.isEnlisted && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                          Joined
                        </span>
                      )}
                      {isCreator && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs rounded-full flex items-center">
                          <Crown size={12} className="mr-1" />
                          Creator
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
                      {!isCreator && (
                        group.isEnlisted ? (
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
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredGroups.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                {error ? 'Unable to load groups' : searchTerm || selectedSubject !== 'all' ? 'No groups match your search' : 'No public groups available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {error ? 'Please try again later or check your connection' : searchTerm || selectedSubject !== 'all' ? 'Try adjusting your search criteria' : 'Check back later for new study groups'}
              </p>
              {error && (
                <Button onClick={loadPublicGroups} variant="outline" className="mt-4">
                  Try Again
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
