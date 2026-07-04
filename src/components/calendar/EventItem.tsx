import { Button } from '@/components/ui/button';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { BookOpen, FileText, Users, Edit, Clock, ExternalLink } from 'lucide-react';
import { StudyEvent } from '@/hooks/useStudyEvents';
import { useNavigate } from 'react-router-dom';

export const getEventIcon = (type: string) => {
  switch (type) {
    case 'study-session': return <BookOpen size={13} className="text-blue-500" />;
    case 'test': return <FileText size={13} className="text-rose-500" />;
    case 'group-session': return <Users size={13} className="text-emerald-500" />;
    default: return <BookOpen size={13} className="text-gray-500" />;
  }
};

export const getCategoryLabel = (type: string) => {
  switch (type) {
    case 'study-session': 
      return { 
        label: 'Study Session', 
        color: 'text-blue-600 dark:text-blue-400', 
        dot: 'bg-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
      };
    case 'test': 
      return { 
        label: 'Test Prep', 
        color: 'text-rose-600 dark:text-rose-400', 
        dot: 'bg-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
      };
    case 'group-session': 
      return { 
        label: 'Group Session', 
        color: 'text-emerald-600 dark:text-emerald-400', 
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
      };
    default: 
      return { 
        label: 'Event', 
        color: 'text-gray-600 dark:text-gray-400', 
        dot: 'bg-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
      };
  }
};

export const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'running':
      return { text: 'Active', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20' };
    case 'paused':
      return { text: 'Paused', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20' };
    case 'completed':
    case 'finished':
      return { text: 'Completed', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 dark:bg-blue-500/20' };
    case 'cancelled':
      return { text: 'Cancelled', bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 dark:bg-rose-500/20' };
    default: // scheduled
      return { text: 'Scheduled', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20' };
  }
};

interface EventItemProps {
  event: StudyEvent;
  compact: boolean;
  onUpdate: () => void;
}

export const EventItem = ({ event, compact, onUpdate }: EventItemProps) => {
  const navigate = useNavigate();
  const category = getCategoryLabel(event.type);
  const statusInfo = event.status ? getStatusStyle(event.status) : null;

  return (
    <div className={`group relative ${compact ? 'p-3' : 'p-4'} bg-white dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-800/80 hover:border-gray-200 dark:hover:border-slate-700 shadow-sm transition-all duration-200`}>
      {/* Top row: Category tag & Status / Action */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-1.5 h-1.5 rounded-full ${category.dot}`} />
          <span className={`text-[10px] font-bold tracking-wider uppercase ${category.color}`}>
            {category.label}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {statusInfo && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.bg}`}>
              {statusInfo.text}
            </span>
          )}
          
          {!compact && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="space-y-1.5">
        <h4 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-white leading-snug`}>
          {event.title}
        </h4>
        
        {/* Meta Row: Group, Subject, Time */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {event.group && (
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {event.group.name}
            </span>
          )}
          {event.group && event.subject && <span className="text-gray-300 dark:text-gray-600">·</span>}
          {event.subject && (
            <span className="text-gray-600 dark:text-gray-300 font-medium">{event.subject}</span>
          )}
          {(event.group || event.subject) && <span className="text-gray-300 dark:text-gray-600">·</span>}
          <span className="flex items-center text-gray-500 dark:text-gray-400">
            <Clock size={12} className="mr-1 text-gray-400" />
            <span>{event.time}</span>
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 line-clamp-2 leading-relaxed italic">
            "{event.description}"
          </p>
        )}

        {/* Action Button */}
        {event.group_id && !['completed', 'finished', 'cancelled'].includes(event.status?.toLowerCase() || '') && (
          <div className="mt-3">
            <Button
              onClick={() => navigate(`/group-study-session?id=${event.id}`)}
              className={`w-full text-white flex items-center justify-center text-xs py-1 h-8 ${
                ['active', 'running', 'paused'].includes(event.status?.toLowerCase() || '')
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              size="sm"
            >
              <ExternalLink size={12} className="mr-1" />
              {['active', 'running', 'paused'].includes(event.status?.toLowerCase() || '') ? 'Join Live Session' : 'Enter Session'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

