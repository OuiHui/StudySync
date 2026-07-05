import { useState } from 'react';
import { Users, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicGroups } from '@/hooks/usePublicGroups';
import { GroupCard } from './GroupCard';

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
        <p className="text-gray-600 dark:text-gray-300 mt-1 flex flex-wrap items-center gap-x-2">
          <span>Find and join study groups by subject</span>
          {!loading && (
            <>
              <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>
              <span className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredGroups.length}</span> available
                </span>
                <span className="text-gray-300 dark:text-gray-700 font-normal">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-green-600 dark:text-green-400">{filteredGroups.filter(g => g.isEnlisted).length}</span> joined
                </span>
              </span>
            </>
          )}
        </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isMyGroupPage={false}
                currentUserId={user?.id}
                onClick={() => onSelectGroup(group.id)}
              />
            ))}
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
