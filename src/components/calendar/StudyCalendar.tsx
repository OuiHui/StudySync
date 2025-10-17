import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

interface StudyEvent {
  id: string;
  title: string;
  type: 'study-session' | 'test' | 'group-session';
  date: Date;
  time: string;
  subject?: string;
  participants?: number;
}

interface StudyCalendarProps {
  showAddButton?: boolean;
  compact?: boolean;
}

export const StudyCalendar = ({ showAddButton = true, compact = false }: StudyCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Mock events data
  const [events] = useState<StudyEvent[]>([
    {
      id: '1',
      title: 'Math Study Session',
      type: 'study-session',
      date: new Date(2024, 0, 15),
      time: '14:00',
      subject: 'Calculus'
    },
    {
      id: '2',
      title: 'Physics Test',
      type: 'test',
      date: new Date(2024, 0, 18),
      time: '10:00',
      subject: 'Quantum Mechanics'
    },
    {
      id: '3',
      title: 'Chemistry Group Study',
      type: 'group-session',
      date: new Date(2024, 0, 20),
      time: '16:30',
      subject: 'Organic Chemistry',
      participants: 8
    },
    {
      id: '4',
      title: 'History Review',
      type: 'study-session',
      date: new Date(2024, 0, 22),
      time: '19:00',
      subject: 'World War II'
    }
  ]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
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

  return (
    <div className={`${compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
      {/* Calendar */}
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
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={`rounded-md border dark:border-gray-600 ${compact ? 'text-sm' : ''}`}
            modifiers={{
              hasEvent: (date) => hasEvents(date)
            }}
            modifiersStyles={{
              hasEvent: {
                backgroundColor: '#dbeafe',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Events for Selected Date or Upcoming Events in compact mode */}
      {!compact ? (
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-white">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(event.type)}
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white">{event.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{event.subject}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{event.time}</p>
                          {event.participants && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{event.participants} participants</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getEventColor(event.type)}>
                        {event.type.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No events scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upcoming Events</h3>
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => (
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
          </div>
        </div>
      )}
    </div>
  );
};
