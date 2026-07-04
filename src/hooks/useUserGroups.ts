import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupInfo {
  id: string;
  name: string;
  subject: string;
  members: number;
  user_role: string;
  nextSession: any;
  description: string;
  color: string;
  icon: string;
  recentActivity: string;
  created_at: string;
  created_by?: string;
  is_public: boolean;
  creator_profile?: any;
  role?: string; // For visitor/anonymous
}

export const getUserGroupsQueryOptions = (user: any, isAnonymous: boolean) => ({
  queryKey: ['user-groups', user?.id, isAnonymous],
  queryFn: async () => {
    if (isAnonymous) {
      // For anonymous users, show public groups
      const publicGroups = await StudyGroupsService.getPublicGroups();
      
      // Transform public groups to match our component structure
      return publicGroups.map((group: any) => ({
        id: group.id,
        name: group.name,
        subject: group.subject || 'General',
        members: group.member_count || 0,
        role: 'visitor', // Anonymous users are visitors
        user_role: 'visitor',
        nextSession: null,
        description: group.description || '',
        color: group.color || 'from-blue-500 to-blue-600',
        icon: group.icon || 'Users',
        recentActivity: 'Public group',
        created_at: group.created_at,
        is_public: group.is_public,
        creator_profile: group.creator_profile
      }));
    }

    const data = await StudyGroupsService.getUserGroups();
    
    // Transform the data to match our component structure
    return data.map((group: any) => ({
      id: group.id,
      name: group.name,
      subject: group.subject || 'General',
      members: group.member_count || 0,
      user_role: group.user_role || 'member',
      nextSession: null,
      description: group.description || '',
      color: group.color || 'from-blue-500 to-blue-600',
      icon: group.icon || 'Users',
      recentActivity: 'No recent activity',
      created_at: group.created_at,
      created_by: group.created_by,
      is_public: group.is_public
    }));
  },
  staleTime: 5 * 60 * 1000, // cache for 5 minutes
});

export function useUserGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAnonymous = !user || !user.email || user.is_anonymous === true || user.aud === 'anonymous';

  const { data: studyGroups = [], isLoading: loading, error, refetch: loadUserGroups } = useQuery<GroupInfo[], Error>(
    getUserGroupsQueryOptions(user, isAnonymous)
  );

  const isAnonymousUser = useCallback(() => {
    return isAnonymous;
  }, [isAnonymous]);

  const handleJoinGroup = async (groupId: string) => {
    try {
      if (isAnonymous) {
        window.location.href = '/auth';
        return;
      }
      await StudyGroupsService.joinGroup(groupId);
      await queryClient.invalidateQueries({ queryKey: ['user-groups'] });
    } catch (err) {
      console.error('Error joining group:', err);
      throw err;
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await StudyGroupsService.leaveGroup(groupId);
      await queryClient.invalidateQueries({ queryKey: ['user-groups'] });
    } catch (err) {
      console.error('Error leaving group:', err);
      throw err;
    }
  };

  const handleGroupUpdated = (updatedGroup: any) => {
    queryClient.setQueryData<GroupInfo[]>(['user-groups', user?.id, isAnonymous], (old) => {
      if (!old) return old;
      return old.map(group => 
        group.id === updatedGroup.id 
          ? { 
              ...group, 
              ...updatedGroup,
              color: updatedGroup.color || group.color || 'from-blue-500 to-blue-600',
              icon: updatedGroup.icon || group.icon || 'Users'
            }
          : group
      );
    });
  };

  const handleGroupDeleted = (groupId: string) => {
    queryClient.setQueryData<GroupInfo[]>(['user-groups', user?.id, isAnonymous], (old) => {
      if (!old) return old;
      return old.filter(group => group.id !== groupId);
    });
  };

  const errorMessage = error ? 'Unable to load study groups. This might be due to database access restrictions or you may not be a member of any groups yet.' : null;

  return {
    studyGroups,
    loading,
    error: errorMessage,
    isAnonymousUser,
    loadUserGroups,
    handleJoinGroup,
    handleLeaveGroup,
    handleGroupUpdated,
    handleGroupDeleted
  };
}
