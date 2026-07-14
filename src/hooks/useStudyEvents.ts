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

export const getStudyEventsQueryOptions = (user: any) => ({
  queryKey: ['studyEvents', user?.id],
  queryFn: async () => {
    const data = await StudyEventsService.getEvents();
    
    return data.map((session: any) => ({
      id: session.id,
      title: session.title,
      type: session.group_id ? 'group-session' : 'study-session',
      date: new Date(session.scheduled_start),
      time: `${format(new Date(session.scheduled_start), 'h:mm a')} - ${format(new Date(session.scheduled_end), 'h:mm a')}`,
      subject: session.study_groups?.subject || 'General',
      status: session.status,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      description: session.description,
      max_participants: session.max_participants,
      created_by: session.created_by,
      group_id: session.group_id,
      is_public: session.is_public,
      group: session.study_groups ? {
        id: session.study_groups.id,
        name: session.study_groups.name,
        subject: session.study_groups.subject
      } : undefined
    }));
  },
  enabled: !!user,
  staleTime: 5 * 60 * 1000,
});

export const useStudyEvents = () => {
  const { user } = useAuth();
  
  const { data: events = [], isLoading: loading, error, refetch: loadEvents } = useQuery<StudyEvent[], Error>(getStudyEventsQueryOptions(user));

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => 
      isAfter(event.date, now) || event.date.toDateString() === now.toDateString()
    );
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
