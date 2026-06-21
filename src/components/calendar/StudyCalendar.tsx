import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useStudyEvents, StudyEvent } from '@/hooks/useStudyEvents';
import { EventItem } from './EventItem';
import { UpcomingEvents } from './UpcomingEvents';

interface StudyCalendarProps {
  showAddButton?: boolean;
  compact?: boolean;
  onDateClick?: (date: Date, events: StudyEvent[]) => void;
}

export const StudyCalendar = ({ showAddButton = true, compact = false, onDateClick }: StudyCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { loading, error, loadEvents, getEventsForDate, getUpcomingEvents, hasEvents } = useStudyEvents();

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date, getEventsForDate(date));
    }
  };

  return (
    <div className={`${compact ? 'space-y-4' : 'space-y-6'}`}>
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
                    formatDay: (date) => {
                      const dayNumber = date.getDate().toString();
                      const eventExists = hasEvents(date);
                      const today = isToday(date);
                      if (eventExists) return `${dayNumber}●`;
                      return dayNumber;
                    }
                  }}
                />
              </div>

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
                        <EventItem key={event.id} event={event} compact={compact} onUpdate={loadEvents} />
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
        
      {compact && (
        <UpcomingEvents events={getUpcomingEvents()} loading={loading} onUpdate={loadEvents} />
      )}
    </div>
  );
};
