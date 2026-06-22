import { useQuery } from '@tanstack/react-query';
import { StudySessionsService, StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupData {
  group: any;
  members: any[];
  sessions: any[];
}

export const useGroupData = (groupId: string) => {
  const { user } = useAuth();

  const queryKey = ['group', groupId, user?.id];

  const { data, isLoading: loading, error } = useQuery<GroupData, Error>({
    queryKey,
    queryFn: async () => {
      const groupDataPromise = StudyGroupsService.getGroupById(groupId);
      const groupMembersPromise = StudyGroupsService.getGroupMembers(groupId);
      const sessionsPromise = user ? StudySessionsService.getSessionsByGroup(groupId) : Promise.resolve([]);

      const [groupData, groupMembers, groupSessions] = await Promise.all([
        groupDataPromise,
        groupMembersPromise,
        sessionsPromise
      ]);
      
      return {
        group: groupData,
        members: groupMembers,
        sessions: user ? groupSessions : []
      };
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });

  return { 
    group: data?.group || null, 
    members: data?.members || [], 
    sessions: data?.sessions || [], 
    loading, 
    error: error ? error.message : null 
  };
};
