import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { format } from 'date-fns';
import { StudyEvent } from '@/hooks/useStudyEvents';
import { getEventIcon, getEventColor } from './EventItem';
import { Edit } from 'lucide-react';

interface UpcomingEventsProps {
  events: StudyEvent[];
  loading: boolean;
  onUpdate: () => void;
}

export const UpcomingEvents = ({ events, loading, onUpdate }: UpcomingEventsProps) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upcoming Events</h3>
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-blue-400 min-h-[60px]">
              {getEventIcon(event.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{event.title}</p>
                {event.group && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{event.group.name}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(event.date, 'EEE, MMM d')} at {format(new Date(event.scheduled_start), 'h:mm a')}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Badge className={`${getEventColor(event.type)} text-xs`}>
                  {event.type === 'group-session' ? 'Group' : event.type === 'test' ? 'Test' : 'Study'}
                </Badge>
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
                  onSessionUpdated={onUpdate}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Edit size={12} />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
          )}
        </div>
      )}
    </div>
  );
};
