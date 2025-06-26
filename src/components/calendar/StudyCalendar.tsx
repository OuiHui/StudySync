import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, FileText, Users, Loader2, Edit, X } from 'lucide-react';
import { format, isAfter, isToday } from 'date-fns';
import { StudyEventsService } from '@/services/database';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';

interface StudyEvent {
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

interface StudyCalendarProps {
  showAddButton?: boolean;
  compact?: boolean;
  onDateClick?: (date: Date, events: StudyEvent[]) => void;
}

export const StudyCalendar = ({ showAddButton = true, compact = false, onDateClick }: StudyCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudyEventsService.getEvents();
      
      // Transform the data to match our StudyEvent interface
      const transformedEvents: StudyEvent[] = data.map(session => ({
        id: session.id,
        title: session.title,
        type: session.group_id ? 'group-session' : 'study-session',
        date: new Date(session.scheduled_start),
        time: format(new Date(session.scheduled_start), 'HH:mm'),
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'study-session':
        return <BookOpen size={14} />;
      case 'test':
        return <FileText size={14} />;
      case 'group-session':
        return <Users size={14} />;
      default:
        return <BookOpen size={14} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'study-session':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'test':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'group-session':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    
    // If there's an onDateClick prop, call it
    if (onDateClick) {
      onDateClick(date, dayEvents);
    }
    
    // Don't show popup anymore - events will display on the right side
  };

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'}`}>
      {/* Calendar with integrated events panel */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} text-gray-800 dark:text-white`}>Study Calendar</CardTitle>
          {showAddButton && !compact && (
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus size={16} className="mr-2" />
              Add Event
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading calendar...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <Button onClick={loadEvents} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar on the left */}
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className={`rounded-md border dark:border-gray-600 ${compact ? 'text-sm' : ''}`}
                  modifiers={{
                    hasEvent: (date) => hasEvents(date),
                    today: (date) => isToday(date)
                  }}
                  modifiersClassNames={{
                    hasEvent: 'relative bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold',
                    today: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-bold ring-2 ring-orange-500'
                  }}
                  formatters={{
                    formatDay: (date, options) => {
                      const dayNumber = date.getDate().toString();
                      const hasEvent = hasEvents(date);
                      const today = isToday(date);
                      
                      if (today && hasEvent) {
                        return `${dayNumber}●`;
                      } else if (hasEvent) {
                        return `${dayNumber}●`;
                      } else if (today) {
                        return dayNumber;
                      }
                      return dayNumber;
                    }
                  }}
                />
              </div>

              {/* Events panel on the right */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800 dark:text-white`}>
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-64">
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {getEventIcon(event.type)}
                              <div className="flex-1">
                                <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-800 dark:text-white`}>{event.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{event.subject}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{event.time}</p>
                                {event.group && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400">Group: {event.group.name}</p>
                                )}
                                {event.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                                )}
                                {event.status && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getEventColor(event.type)} text-xs`}>
                                {event.type.replace('-', ' ')}
                              </Badge>
                              {!compact && (
                                <EditSessionDialog 
                                  session={{
                                    id: event.id,
                                    title: event.title,
                                    description: event.description,
                                    scheduled_start: event.scheduled_start,
                                    scheduled_end: event.scheduled_end,
                                    max_participants: event.max_participants,
                                    group_id: event.group_id,
                                    status: event.status
                                  }}
                                  onSessionUpdated={loadEvents}
                                  trigger={
                                    <Button variant="outline" size="sm">
                                      <Edit size={12} />
                                    </Button>
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No events scheduled for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        
        {/* Compact mode upcoming events */}
        {compact && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upcoming Events</h3>
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {getUpcomingEvents().slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{format(event.date, 'MMM d')} at {event.time}</p>
                    </div>
                    <Badge className={`${getEventColor(event.type)} text-xs`}>
                      {event.type === 'group-session' ? 'Group' : event.type === 'test' ? 'Test' : 'Study'}
                    </Badge>
                  </div>
                ))}
                {getUpcomingEvents().length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
};
