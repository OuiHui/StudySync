import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { StudySessionsService, SessionHistoryItem } from '@/services/studySessions';

const PAGE_SIZE = 10;

export const useSessionHistory = () => {
  const { user } = useAuth();

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery<
    SessionHistoryItem[]
  >({
    queryKey: ['sessionHistory', user?.id],
    queryFn: ({ pageParam }) =>
      StudySessionsService.getSessionHistory(user!.id, PAGE_SIZE, (pageParam as number) ?? 0),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    enabled: !!user,
    staleTime: 0,
  });

  const sessions = data?.pages.flat() ?? [];

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    sessions,
    loading: isLoading,
    isFetchingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    fetchMore,
  };
};
