import { useQuery } from '@tanstack/react-query';
import { StudyEventsService } from '@/services/database';
import { format, isAfter } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export interface StudyEvent {
  id: string;
  title: string;
  type: 'study-session' | 'test' | 'group-session';
  date: Date;
  time: string;
  subject?: string;
  participants?: number;
  status?: string;
  scheduled_start: string;
  scheduled_end: string;
  description?: string;
  max_participants?: number;
  created_by?: string;
  group_id?: string;
  is_public?: boolean;
  group?: {
    id: string;
    name: string;
    subject: string | null;
  };
}

export const getStudyEventsQueryOptions = (user: { id?: string } | null) => ({
  queryKey: ['studyEvents', user?.id],
  queryFn: async () => {
    const data = await StudyEventsService.getEvents();
    
    return data.map((session) => {
      const sess = session as Record<string, unknown>;
      const studyGroups = sess.study_groups as { id: string; name: string; subject: string | null } | null;
      const scheduledStart = String(sess.scheduled_start);
      const scheduledEnd = String(sess.scheduled_end);

      return {
        id: String(sess.id),
        title: String(sess.title),
        type: (sess.group_id ? 'group-session' : 'study-session') as 'study-session' | 'test' | 'group-session',
        date: new Date(scheduledStart),
        time: `${format(new Date(scheduledStart), 'h:mm a')} - ${format(new Date(scheduledEnd), 'h:mm a')}`,
        subject: studyGroups?.subject || 'General',
        status: sess.status as string,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        description: sess.description as string | undefined,
        max_participants: sess.max_participants as number | undefined,
        created_by: sess.created_by as string | undefined,
        group_id: sess.group_id as string | undefined,
        is_public: sess.is_public as boolean | undefined,
        group: studyGroups ? {
          id: studyGroups.id,
          name: studyGroups.name,
          subject: studyGroups.subject
        } : undefined
      };
    });
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000,
});

export const useStudyEvents = () => {
  const { user } = useAuth();
  
  const { data: rawEvents = [], isLoading: loading, error, refetch: loadEvents } = useQuery(getStudyEventsQueryOptions(user));
  const events = (rawEvents || []) as StudyEvent[];

  const toDate = (d: Date | string): Date => (d instanceof Date ? d : new Date(d));

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      toDate(event.date).toDateString() === date.toDateString()
    );
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => {
      const d = toDate(event.date);
      return isAfter(d, now) || d.toDateString() === now.toDateString();
    });
  };

  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  return { 
    events, 
    loading, 
    error: error ? error.message : null, 
    loadEvents, 
    getEventsForDate, 
    getUpcomingEvents, 
    hasEvents 
  };
};
