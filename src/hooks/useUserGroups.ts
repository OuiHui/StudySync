import { useState, useEffect, useCallback } from 'react';
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

export function useUserGroups() {
  const { user } = useAuth();
  const [studyGroups, setStudyGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAnonymousUser = useCallback(() => {
    return !user || !user.email || user.is_anonymous === true || user.aud === 'anonymous';
  }, [user]);

  const loadUserGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isAnonymous = isAnonymousUser();
      
      if (isAnonymous) {
        // For anonymous users, show public groups
        const publicGroups = await StudyGroupsService.getPublicGroups();
        
        // Transform public groups to match our component structure
        const transformedGroups = publicGroups.map((group: any) => ({
          id: group.id,
          name: group.name,
          subject: group.subject || 'General',
          members: group.member_count || 0,
          role: 'visitor', // Anonymous users are visitors
          user_role: 'visitor',
          nextSession: null,
          description: group.description || '',
          color: group.color || 'from-blue-500 to-blue-600', // Use database value or default
          icon: group.icon || 'Users', // Use database value or default
          recentActivity: 'Public group',
          created_at: group.created_at,
          is_public: group.is_public,
          creator_profile: group.creator_profile
        }));
        
        setStudyGroups(transformedGroups);
        return;
      }
      
      const data = await StudyGroupsService.getUserGroups();
      
      // Transform the data to match our component structure
      const transformedGroups = data.map((group: any) => ({
        id: group.id,
        name: group.name,
        subject: group.subject || 'General',
        members: group.member_count || 0,
        user_role: group.user_role || 'member', // Keep as user_role for consistency
        nextSession: null, // This would come from study_sessions
        description: group.description || '',
        color: group.color || 'from-blue-500 to-blue-600', // Use database value or default
        icon: group.icon || 'Users', // Use database value or default
        recentActivity: 'No recent activity',
        created_at: group.created_at,
        created_by: group.created_by, // Include created_by for admin check
        is_public: group.is_public
      }));
      
      setStudyGroups(transformedGroups);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Unable to load study groups. This might be due to database access restrictions or you may not be a member of any groups yet.');
    } finally {
      setLoading(false);
    }
  }, [isAnonymousUser]);

  useEffect(() => {
    loadUserGroups();
  }, [loadUserGroups]);

  const handleJoinGroup = async (groupId: string) => {
    try {
      if (isAnonymousUser()) {
        window.location.href = '/auth';
        return;
      }
      await StudyGroupsService.joinGroup(groupId);
      loadUserGroups();
    } catch (err) {
      console.error('Error joining group:', err);
      throw err;
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await StudyGroupsService.leaveGroup(groupId);
      loadUserGroups();
    } catch (err) {
      console.error('Error leaving group:', err);
      throw err;
    }
  };

  const handleGroupUpdated = (updatedGroup: any) => {
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

  return {
    studyGroups,
    loading,
    error,
    isAnonymousUser,
    loadUserGroups,
    handleJoinGroup,
    handleLeaveGroup,
    handleGroupUpdated,
    handleGroupDeleted
  };
}
