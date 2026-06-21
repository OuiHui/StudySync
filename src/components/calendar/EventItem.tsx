import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { BookOpen, FileText, Users, Edit } from 'lucide-react';
import { StudyEvent } from '@/hooks/useStudyEvents';

export const getEventIcon = (type: string) => {
  switch (type) {
    case 'study-session': return <BookOpen size={14} />;
    case 'test': return <FileText size={14} />;
    case 'group-session': return <Users size={14} />;
    default: return <BookOpen size={14} />;
  }
};

export const getEventColor = (type: string) => {
  switch (type) {
    case 'study-session': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    case 'test': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    case 'group-session': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

interface EventItemProps {
  event: StudyEvent;
  compact: boolean;
  onUpdate: () => void;
}

export const EventItem = ({ event, compact, onUpdate }: EventItemProps) => {
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-400">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 flex-1">
          {getEventIcon(event.type)}
          <div className="flex-1 min-w-0">
            <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-800 dark:text-white truncate`}>{event.title}</h4>
            {event.group && (
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{event.group.name}</p>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{event.subject}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{event.time}</p>
            {event.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>
            )}
            {event.status && (
              <Badge variant="outline" className="text-xs mt-1">
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
          <Badge className={`${getEventColor(event.type)} text-xs whitespace-nowrap`}>
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
              onSessionUpdated={onUpdate}
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
  );
};
