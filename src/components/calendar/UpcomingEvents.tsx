import { Loader2, Edit, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { format } from 'date-fns';
import { StudyEvent } from '@/hooks/useStudyEvents';
import { getEventIcon, getCategoryLabel } from './EventItem';

interface UpcomingEventsProps {
  events: StudyEvent[];
  loading: boolean;
  onUpdate: () => void;
}

export const UpcomingEvents = ({ events, loading, onUpdate }: UpcomingEventsProps) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Upcoming Events</h3>
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.slice(0, 3).map((event) => {
            const category = getCategoryLabel(event.type);
            return (
              <div key={event.id} className="group relative flex items-start space-x-3 p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-800/80 hover:border-gray-200 dark:hover:border-slate-700 shadow-sm transition-all duration-200">
                <div className={`p-2 rounded-lg ${category.bg} flex-shrink-0 flex items-center justify-center h-8 w-8`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-snug">{event.title}</p>
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${category.color} flex-shrink-0 mt-0.5`}>
                      {category.label.split(' ')[0]}
                    </span>
                  </div>
                  {event.group && (
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate mt-0.5">{event.group.name}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <Clock size={11} className="mr-1 text-gray-400" />
                    <span>
                      {format(event.date, 'EEE, MMM d')} • {format(new Date(event.scheduled_start), 'h:mm a')}
                    </span>
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1 flex-shrink-0 self-center">
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
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md">
                        <Edit size={12} />
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>
          )}
        </div>
      )}
    </div>
  );
};
