import { Clock, Users, User, ChevronDown } from 'lucide-react';
import { useSessionHistory } from '@/hooks/useSessionHistory';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatEndTime = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  if (sameDay) return formatTime(end);
  const dayLabel = e.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dayLabel} · ${formatTime(end)}`;
};

const formatDuration = (start: string, end: string): string => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return '—';
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    finished:  { label: 'Finished',   className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    completed: { label: 'Completed',  className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    cancelled: { label: 'Cancelled',  className: 'bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center gap-2 py-10 text-center">
    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <Clock size={18} className="text-gray-400" />
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400">No completed sessions yet</p>
    <p className="text-xs text-gray-400 dark:text-gray-500">Finish a study session to see it here</p>
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-2/5" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
    </div>
    <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
  </div>
);

export const SessionHistoryList = () => {
  const { sessions, loading, isFetchingMore, hasMore, fetchMore } = useSessionHistory();

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Study History</h3>
      </div>

      {loading ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {sessions.map(session => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={fetchMore}
              disabled={isFetchingMore}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 disabled:opacity-50"
            >
              {isFetchingMore ? (
                <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronDown size={14} />
              )}
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
};

const SessionRow = ({ session }: { session: ReturnType<typeof useSessionHistory>['sessions'][number] }) => {
  const duration = formatDuration(session.scheduled_start, session.scheduled_end);

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Type icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        session.is_solo
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-violet-50 dark:bg-violet-900/20'
      }`}>
        {session.is_solo
          ? <User size={14} className="text-blue-500 dark:text-blue-400" />
          : <Users size={14} className="text-violet-500 dark:text-violet-400" />
        }
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{session.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(session.scheduled_start)}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
            {formatTime(session.scheduled_start)} → {formatEndTime(session.scheduled_start, session.scheduled_end)}
          </span>
          {!session.is_solo && session.group_name && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-violet-500 dark:text-violet-400 truncate max-w-[120px]">
                {session.group_name}
              </span>
            </>
          )}
          {session.subject && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">{session.subject}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: duration + status */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 tabular-nums">{duration}</span>
        <StatusBadge status={session.status} />
      </div>
    </div>
  );
};
