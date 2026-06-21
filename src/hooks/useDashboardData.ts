import { useState, useEffect } from 'react';
import { StudySessionsService, ProfileService } from '@/services/database';
import { format, isToday, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardSession {
  id: string;
  title: string;
  groupName: string;
  scheduled_start?: string;
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

export const useDashboardData = () => {
  const { user } = useAuth();
  const [attendingSessions, setAttendingSessions] = useState<DashboardSession[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    studyHoursToday: '0',
    studyHoursThisWeek: '0',
    activeGroups: '0',
    notesShared: '0',
    sessionsThisWeek: '0'
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [
        sessions,
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

      let thisWeekSessionsLength = 0;

      if (sessions.status === 'fulfilled') {
        const todaySessions = sessions.value.filter(session => isToday(parseISO(session.scheduled_start)));
        
        const formattedSessions = todaySessions.map(session => ({
          id: session.id,
          title: session.title,
          groupName: session.study_groups?.name || 'Solo Session',
          scheduled_start: session.scheduled_start
        }));
        setAttendingSessions(formattedSessions);

        const today = new Date();
        const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        weekStart.setHours(0, 0, 0, 0);
        const thisWeekSessions = sessions.value.filter(session => {
          const sessionDate = new Date(session.scheduled_start);
          return sessionDate >= weekStart && session.status === 'completed';
        });
        thisWeekSessionsLength = thisWeekSessions.length;
      }

      if (statsResult.status === 'fulfilled') {
        const [statsData, todayHours, weekHours] = statsResult.value;
        setUserStats({
          studyHoursToday: `${todayHours}h`,
          studyHoursThisWeek: `${weekHours}h`,
          activeGroups: String(statsData.groupsJoined || 0),
          notesShared: String(statsData.notesShared || 0),
          sessionsThisWeek: String(thisWeekSessionsLength)
        });
      } else {
        setUserStats({
          studyHoursToday: '0h',
          studyHoursThisWeek: '0h',
          activeGroups: '0',
          notesShared: '0',
          sessionsThisWeek: String(thisWeekSessionsLength)
        });
      }

      if (activityResult.status === 'fulfilled') {
        const formattedActivity = activityResult.value.slice(0, 2).map(item => ({
          type: item.type || 'session',
          description: item.description || item.action || 'Activity completed',
          timestamp: item.time || format(parseISO(item.created_at), 'h:mm a')
        }));
        setRecentActivity(formattedActivity);
      } else {
        setRecentActivity([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleSessionAttendance = (event: CustomEvent) => {
      const { sessionId, groupName, attending } = event.detail;
      
      if (attending) {
        setAttendingSessions(prev => [...prev, {
          id: sessionId,
          title: 'Study Session',
          groupName
        }]);
      } else {
        setAttendingSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    };

    window.addEventListener('sessionAttendanceChanged', handleSessionAttendance as EventListener);
    
    return () => {
      window.removeEventListener('sessionAttendanceChanged', handleSessionAttendance as EventListener);
    };
  }, [user]);

  return { loading, attendingSessions, userStats, recentActivity };
};
