import { useState, useEffect } from 'react';
import { StudyEventsService } from '@/services/database';
import { format, isAfter, isToday } from 'date-fns';

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
  group?: {
    id: string;
    name: string;
    subject: string | null;
  };
}

export const useStudyEvents = () => {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudyEventsService.getEvents();
      
      const transformedEvents: StudyEvent[] = data.map(session => ({
        id: session.id,
        title: session.title,
        type: session.group_id ? 'group-session' : 'study-session',
        date: new Date(session.scheduled_start),
        time: format(new Date(session.scheduled_start), 'h:mm a'),
        subject: session.study_groups?.subject || 'General',
        status: session.status,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        description: session.description,
        max_participants: session.max_participants,
        created_by: session.created_by,
        group_id: session.group_id,
        group: session.study_groups ? {
          id: session.study_groups.id,
          name: session.study_groups.name,
          subject: session.study_groups.subject
        } : undefined
      }));
      
      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

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

  return { events, loading, error, loadEvents, getEventsForDate, getUpcomingEvents, hasEvents };
};
