import { useState, useMemo } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicGroups } from '@/hooks/usePublicGroups';
import { useUserGroups } from '@/hooks/useUserGroups';
import { GroupCard } from './GroupCard';
import { GroupFilterBar, GroupFilterState } from './GroupFilterBar';

interface StudyGroupsBrowseProps {
  onSelectGroup: (groupId: string) => void;
  groupEnrollments?: Record<string, boolean>;
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void;
}

export const StudyGroupsBrowse = ({ onSelectGroup, groupEnrollments = {}, onUpdateEnrollment }: StudyGroupsBrowseProps) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<GroupFilterState>({
    searchTerm: '',
    selectedSubject: 'all',
    selectedVisibility: 'all',
    sortBy: 'name_asc',
  });

  const { availableGroups, loading, error, loadPublicGroups, handleJoinGroup } = usePublicGroups(groupEnrollments, onUpdateEnrollment);
  const { studyGroups: myGroups } = useUserGroups();

  const myGroupIds = useMemo(() => new Set(myGroups.map(g => g.id)), [myGroups]);

  const subjects = useMemo(() => {
    const dynamicSubjects = availableGroups
      .map(g => g.subject?.trim())
      .filter((s): s is string => Boolean(s));

    return Array.from(new Set(dynamicSubjects)).sort((a, b) => 
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [availableGroups]);

  const filteredGroups = useMemo(() => {
    const searchLower = filters.searchTerm.toLowerCase().trim();

    return availableGroups
      .filter(group => {
        if (myGroupIds.has(group.id)) return false;

        const matchesSearch = !searchLower ||
                              group.name.toLowerCase().includes(searchLower) ||
                              group.description.toLowerCase().includes(searchLower) ||
                              (group.subject && group.subject.toLowerCase().includes(searchLower));
        
        const matchesSubject = filters.selectedSubject === 'all' || 
                              (group.subject && group.subject.trim().toLowerCase() === filters.selectedSubject.trim().toLowerCase());

        const matchesVisibility = filters.selectedVisibility === 'all' ||
                              (filters.selectedVisibility === 'public' ? group.is_public : !group.is_public);

        return matchesSearch && matchesSubject && matchesVisibility;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'members_desc') {
          return (b.member_count || 0) - (a.member_count || 0);
        }
        if (filters.sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });
  }, [availableGroups, myGroupIds, filters]);

  const handleFilterChange = (updates: Partial<GroupFilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      selectedSubject: 'all',
      selectedVisibility: 'all',
      sortBy: 'name_asc',
    });
  };

  const isFiltered = Boolean(filters.searchTerm.trim()) || filters.selectedSubject !== 'all' || filters.selectedVisibility !== 'all';

  return (
    <div className="space-y-6">

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <GroupFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableSubjects={subjects}
        onReset={handleResetFilters}
        disabled={loading}
      />

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
                onJoinGroup={() => handleJoinGroup(group.id)}
              />
            ))}
          </div>

          {filteredGroups.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                {error ? 'Unable to load groups' : isFiltered ? 'No groups match your search or selected filters' : 'No public groups available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {error ? 'Please try again later or check your connection' : isFiltered ? 'Try adjusting your search or filters' : 'Check back later for new study groups'}
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
