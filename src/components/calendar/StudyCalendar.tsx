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
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading calendar...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <Button onClick={loadEvents} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar picker */}
              <div className="flex-shrink-0 flex justify-center lg:justify-start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className={`rounded-lg border dark:border-gray-700 ${compact ? 'text-sm' : ''}`}
                  modifiers={{
                    hasEvent: (date) => hasEvents(date),
                    today: (date) => isToday(date)
                  }}
                  modifiersClassNames={{
                    hasEvent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold',
                    today: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-bold ring-1 ring-indigo-400 dark:ring-indigo-600'
                  }}
                  formatters={{
                    formatDay: (date) => {
                      const dayNumber = date.getDate().toString();
                      if (hasEvents(date)) return `${dayNumber}·`;
                      return dayNumber;
                    }
                  }}
                />
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-gray-100 dark:bg-slate-800 self-stretch" />

              {/* Event list for selected date */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800 dark:text-white`}>
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                  </h3>
                  {selectedDateEvents.length > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 max-h-72 pr-0.5">
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event) => (
                      <EventItem key={event.id} event={event} compact={compact} onUpdate={loadEvents} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <span className="text-gray-400 text-lg">📅</span>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No events on this day</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Select another date or create a session</p>
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
