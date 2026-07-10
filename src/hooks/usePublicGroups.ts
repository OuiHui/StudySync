import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

export interface PublicGroupInfo {
  id: string;
  name: string;
  subject: string;
  description: string;
  members: number;
  admin: string;
  sessions: number;
  isEnlisted: boolean;
  color: string;
  icon: string;
  created_at: string;
  max_members: number;
  created_by: string;
}

const getSubjectColor = (subject: string) => {
  const colorMap: Record<string, string> = {
    'Mathematics': 'bg-blue-500',
    'Physics': 'bg-purple-500',
    'Chemistry': 'bg-green-500',
    'Biology': 'bg-emerald-500',
    'Computer Science': 'bg-orange-500',
    'History': 'bg-red-500',
    'Literature': 'bg-pink-500',
    'Psychology': 'bg-indigo-500',
    'Economics': 'bg-yellow-500',
    'General': 'bg-gray-500'
  };
  return colorMap[subject] || 'bg-gray-500';
};

const normalizeColor = (color: string) => {
  if (!color) return null;
  if (color.includes('from-') && color.includes('to-')) {
    return `bg-gradient-to-br ${color}`;
  }
  const colorMap: { [key: string]: string } = {
    'bg-blue-500': 'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-purple-500': 'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-green-500': 'bg-gradient-to-br from-green-500 to-green-600',
    'bg-red-500': 'bg-gradient-to-br from-red-500 to-red-600',
    'bg-orange-500': 'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-pink-500': 'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-indigo-500': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-teal-500': 'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-yellow-500': 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-cyan-500': 'bg-gradient-to-br from-cyan-500 to-cyan-600'
  };
  return colorMap[color] || `bg-gradient-to-br ${color}`;
};

export function usePublicGroups(
  groupEnrollments: Record<string, boolean> = {},
  onUpdateEnrollment?: (groupId: string, enrolled: boolean) => void
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rawGroups = [], isLoading: loading, error, refetch: loadPublicGroups } = useQuery<any[], Error>({
    queryKey: ['public-groups'],
    queryFn: async () => {
      const publicGroups = await StudyGroupsService.getPublicGroups();
      return publicGroups || [];
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const availableGroups = useMemo(() => {
    return rawGroups.map(group => ({
      id: group.id,
      name: group.name,
      subject: group.subject || 'General',
      description: group.description || 'No description available',
      members: group.member_count || 0,
      admin: group.creator_profile?.display_name || 'Group Admin',
      sessions: group.sessions_count || 0,
      isEnlisted: groupEnrollments[group.id] || false,
      color: normalizeColor((group as any).color) || getSubjectColor(group.subject || 'General'),
      icon: (group as any).icon || 'BookOpen',
      created_at: group.created_at,
      max_members: group.max_members,
      created_by: group.created_by,
      is_public: group.is_public ?? true
    }));
  }, [rawGroups, groupEnrollments]);

  const handleJoinGroup = async (groupId: string) => {
    try {
      await StudyGroupsService.joinGroup(groupId);
      queryClient.setQueryData<any[]>(['public-groups'], (old) => {
        if (!old) return old;
        return old.map(group =>
          group.id === groupId
            ? { ...group, member_count: (group.member_count || 0) + 1 }
            : group
        );
      });
      onUpdateEnrollment?.(groupId, true);
    } catch (err) {
      console.error('Error joining group:', err);
      throw err;
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await StudyGroupsService.leaveGroup(groupId);
      queryClient.setQueryData<any[]>(['public-groups'], (old) => {
        if (!old) return old;
        return old.map(group =>
          group.id === groupId
            ? { ...group, member_count: Math.max(0, (group.member_count || 0) - 1) }
            : group
        );
      });
      onUpdateEnrollment?.(groupId, false);
    } catch (err) {
      console.error('Error leaving group:', err);
      throw err;
    }
  };

  const handleCreateGroup = (newGroup: any) => {
    if (newGroup && newGroup.is_public) {
      const rawGroup = {
        id: newGroup.id,
        name: newGroup.name,
        subject: newGroup.subject,
        description: newGroup.description,
        member_count: 1,
        creator_profile: {
          display_name: user?.email || user?.user_metadata?.display_name || 'You'
        },
        color: newGroup.color,
        icon: newGroup.icon,
        created_at: newGroup.created_at,
        max_members: newGroup.max_members,
        created_by: user?.id || ''
      };
      
      queryClient.setQueryData<any[]>(['public-groups'], (old) => {
        if (!old) return [rawGroup];
        return [rawGroup, ...old];
      });
      onUpdateEnrollment?.(newGroup.id, true);
    }
  };

  const errorMessage = error ? 'Unable to load study groups. Please check your internet connection or try again later.' : null;

  return {
    availableGroups,
    loading,
    error: errorMessage,
    loadPublicGroups,
    handleJoinGroup,
    handleLeaveGroup,
    handleCreateGroup,
    getSubjectColor
  };
}
