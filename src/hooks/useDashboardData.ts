import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StudySessionsService, ProfileService } from '@/services/database';
import { format, isToday, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardSession {
  id: string;
  title: string;
  groupName: string;
  scheduled_start?: string;
  isSolo?: boolean;
}

export interface UserStats {
  studyHoursToday: string;
  studyHoursThisWeek: string;
  activeGroups: string;
  notesShared: string;
  sessionsThisWeek: string;
}

export interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

export interface DashboardData {
  attendingSessions: DashboardSession[];
  userStats: UserStats;
  recentActivity: ActivityItem[];
}

export const getDashboardQueryOptions = (user: any) => ({
  queryKey: ['dashboard', user?.id],
  queryFn: async () => {
    if (!user) throw new Error('User not authenticated');

    const [
      sessionsResult,
      statsResult,
      activityResult
    ] = await Promise.allSettled([
      StudySessionsService.getSessions(),
      Promise.all([
        ProfileService.getUserStats(),
        ProfileService.getStudyHoursToday(),
        ProfileService.getStudyHoursThisWeek()
      ]),
      ProfileService.getRecentActivity()
    ]);

    let attendingSessions: DashboardSession[] = [];
    let thisWeekSessionsLength = 0;

    if (sessionsResult.status === 'fulfilled') {
      const sessions = sessionsResult.value;
      const ENDED_STATUSES = new Set(['finished', 'completed', 'cancelled']);
      const todaySessions = sessions.filter(session =>
        isToday(parseISO(session.scheduled_start)) &&
        !ENDED_STATUSES.has(session.status)
      );

      attendingSessions = todaySessions.map(session => ({
        id: session.id,
        title: session.title,
        groupName: session.study_groups?.name || 'Solo Session',
        scheduled_start: session.scheduled_start,
        isSolo: !session.group_id
      }));

      const today = new Date();
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      weekStart.setHours(0, 0, 0, 0);
      const thisWeekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduled_start);
        return sessionDate >= weekStart && (session.status === 'completed' || session.status === 'finished');
      });
      thisWeekSessionsLength = thisWeekSessions.length;
    }

    let userStats: UserStats = {
      studyHoursToday: '0h',
      studyHoursThisWeek: '0h',
      activeGroups: '0',
      notesShared: '0',
      sessionsThisWeek: String(thisWeekSessionsLength)
    };

    if (statsResult.status === 'fulfilled') {
      const [statsData, todayHours, weekHours] = statsResult.value;
      userStats = {
        studyHoursToday: `${todayHours}h`,
        studyHoursThisWeek: `${weekHours}h`,
        activeGroups: String(statsData.groupsJoined || 0),
        notesShared: String(statsData.notesShared || 0),
        sessionsThisWeek: String(thisWeekSessionsLength)
      };
    }

    let recentActivity: ActivityItem[] = [];
    if (activityResult.status === 'fulfilled') {
      recentActivity = activityResult.value.slice(0, 2).map(item => ({
        type: item.type || 'session',
        description: item.description || item.action || 'Activity completed',
        timestamp: item.time || format(parseISO(item.created_at), 'h:mm a')
      }));
    }

    return { attendingSessions, userStats, recentActivity };
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
});

export const useDashboardData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['dashboard', user?.id];

  const { data, isLoading: loading } = useQuery<DashboardData>(getDashboardQueryOptions(user));

  useEffect(() => {
    const handleSessionAttendance = (event: CustomEvent) => {
      const { sessionId, groupName, attending } = event.detail;
      
      queryClient.setQueryData<DashboardData>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        
        let newSessions = [...oldData.attendingSessions];
        if (attending) {
          newSessions.push({
            id: sessionId,
            title: 'Study Session',
            groupName
          });
        } else {
          newSessions = newSessions.filter(s => s.id !== sessionId);
        }
        return { ...oldData, attendingSessions: newSessions };
      });
    };

    window.addEventListener('sessionAttendanceChanged', handleSessionAttendance as EventListener);
    
    return () => {
      window.removeEventListener('sessionAttendanceChanged', handleSessionAttendance as EventListener);
    };
  }, [user, queryClient, queryKey]);

  return {
    loading,
    attendingSessions: data?.attendingSessions || [],
    userStats: data?.userStats || {
      studyHoursToday: '0',
      studyHoursThisWeek: '0',
      activeGroups: '0',
      notesShared: '0',
      sessionsThisWeek: '0'
    },
    recentActivity: data?.recentActivity || []
  };
};
