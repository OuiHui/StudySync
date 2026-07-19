import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StudySessionsService, StudyGroupsService, NotesService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface GroupData {
  group: any;
  members: any[];
  sessions: any[];
  notes: any[];
}

export const useGroupData = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['group', groupId, user?.id];

  const { data, isLoading: loading, error } = useQuery<GroupData, Error>({
    queryKey,
    queryFn: async () => {
      const groupDataPromise = StudyGroupsService.getGroupById(groupId);
      const groupMembersPromise = StudyGroupsService.getGroupMembers(groupId);
      const sessionsPromise = user ? StudySessionsService.getSessionsByGroup(groupId) : Promise.resolve([]);
      const notesPromise = user ? NotesService.getGroupNotes(groupId) : Promise.resolve([]);

      const [groupData, groupMembers, groupSessions, groupNotes] = await Promise.all([
        groupDataPromise,
        groupMembersPromise,
        sessionsPromise,
        notesPromise
      ]);
      
      // Populate React Query cache for group notes so the Notes sub-tab is preloaded
      queryClient.setQueryData(['notes', 'group', groupId], groupNotes);

      return {
        group: groupData,
        members: groupMembers,
        sessions: user ? groupSessions : [],
        notes: user ? groupNotes : []
      };
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!groupId) return;

    // Subscribe to realtime updates for group_members
    const channel = supabase
      .channel(`group-members-realtime-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log(`[Realtime] Group members change received for group ${groupId}:`, payload);
          queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Group members channel status for group ${groupId}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  return { 
    group: data?.group || null, 
    members: data?.members || [], 
    sessions: data?.sessions || [], 
    notes: data?.notes || [],
    loading, 
    error: error ? error.message : null 
  };
};
