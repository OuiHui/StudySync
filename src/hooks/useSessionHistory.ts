import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { StudySessionsService, SessionHistoryItem } from '@/services/studySessions';

const PAGE_SIZE = 10;

export const useSessionHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [allSessions, setAllSessions] = useState<SessionHistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { isLoading, isFetching } = useQuery({
    queryKey: ['sessionHistory', user?.id, offset],
    queryFn: async () => {
      const results = await StudySessionsService.getSessionHistory(PAGE_SIZE, offset);
      setAllSessions(prev => {
        if (offset === 0) return results;
        const existingIds = new Set(prev.map(s => s.id));
        return [...prev, ...results.filter(r => !existingIds.has(r.id))];
      });
      setHasMore(results.length === PAGE_SIZE);
      return results;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const fetchMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset(prev => prev + PAGE_SIZE);
    }
  }, [isFetching, hasMore]);

  const refresh = useCallback(() => {
    setOffset(0);
    setAllSessions([]);
    queryClient.removeQueries({ queryKey: ['sessionHistory', user?.id] });
  }, [queryClient, user?.id]);

  return {
    sessions: allSessions,
    loading: isLoading && offset === 0,
    isFetchingMore: isFetching && offset > 0,
    hasMore,
    fetchMore,
    refresh,
  };
};
