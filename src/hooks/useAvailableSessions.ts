import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StudySessionsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const getAvailableSessionsQueryOptions = (user: any) => ({
  queryKey: ['available-sessions', user?.id],
  queryFn: async () => {
    if (!user) throw new Error('User not authenticated');
    const availableSessions = await StudySessionsService.getAvailableSessions();
    return availableSessions || [];
  },
  enabled: !!user,
  staleTime: 0, // always refetch on page load to ensure live updates
});

export function useAvailableSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loading, error } = useQuery<any[], Error>(
    getAvailableSessionsQueryOptions(user)
  );

  const loadSessions = async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: ['available-sessions', user.id] });
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('available_sessions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, () => {
        loadSessions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants' }, () => {
        loadSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const errorMessage = error ? 'Unable to load study sessions. Please check your internet connection or try again later.' : null;

  return {
    sessions,
    loading,
    error: errorMessage,
    loadSessions,
  };
}
