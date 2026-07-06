import { Calendar, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface GroupSessionsTabProps {
  sessions: any[];
  attendingSessions: string[];
  onAttendSession: (id: string) => void;
  onCancelSession: (id: string) => void;
}

export const GroupSessionsTab = ({ sessions, attendingSessions, onAttendSession, onCancelSession }: GroupSessionsTabProps) => {
  const navigate = useNavigate();

  const displaySessions = sessions.map(session => {
    const sessionDate = new Date(session.scheduled_start);
    const now = new Date();
    const isPast = sessionDate < now;
    
    const isLive = (
      ['active', 'running', 'paused'].includes(session.status) ||
      (session.status === 'scheduled' &&
       sessionDate <= now &&
       new Date(session.scheduled_end) >= now)
    );
    
    return {
      ...session,
      id: session.id,
      title: session.title,
      date: sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: session.duration_minutes ? `${session.duration_minutes} minutes` : '60 minutes',
      attendees: session.participant_count || 0,
      type: isLive ? 'active' as const : 'planned' as const,
      isPast
    };
  });

  const getStartedTimeAgo = (start: string) => {
    const diffMs = new Date().getTime() - new Date(start).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMins < 60) return `Started ${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `Started ${diffHours} hr ago`;
  };

  if (displaySessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No study sessions scheduled</h3>
        <p className="text-gray-600 dark:text-gray-300">This group doesn't have any study sessions yet. Check back later or create one!</p>
      </div>
    );
  }

  // Find any active live sessions
  const liveSession = displaySessions.find(s => s.type === 'active' && !s.isPast);
  
  // Planned sessions are chronological and not past/live
  const plannedSessions = displaySessions.filter(s => s.type === 'planned' && !s.isPast);
  
  // Past sessions are reverse-chronological
  const pastSessions = displaySessions.filter(s => s.isPast && s.type !== 'active').reverse();

  return (
    <div className="space-y-6">
      {/* Live now Hero treatment */}
      {liveSession && (
        <div className="border border-blue-500 bg-blue-50/10 dark:bg-blue-950/10 p-6 rounded-xl shadow-sm relative">
          <div className="flex items-center space-x-1.5 text-green-500 font-semibold text-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live now</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
            {liveSession.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {getStartedTimeAgo(liveSession.scheduled_start)} • {liveSession.attendees || 3} in session
          </p>
          <Button 
            onClick={() => navigate(`/group-study-session?id=${liveSession.id}`)} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm px-6"
          >
            Join session
          </Button>
        </div>
      )}

      {/* Planned Sessions */}
      {plannedSessions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6">
            Planned
          </h4>
          <div className="space-y-4 bg-transparent border-0">
            {plannedSessions.map((session, index) => (
              <div key={session.id}>
                {index > 0 && <div className="border-t border-gray-100 dark:border-gray-800/60 my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">{session.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{session.date} • {session.time}</p>
                    </div>
                  </div>
                  <div>
                    {attendingSessions.includes(session.id) ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Attending</span>
                        <Button 
                          onClick={() => onCancelSession(session.id)} 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => onAttendSession(session.id)} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-blue-500 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        Attend
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6">
            Past
          </h4>
          <div className="space-y-4 bg-transparent border-0">
            {pastSessions.map((session, index) => (
              <div key={session.id}>
                {index > 0 && <div className="border-t border-gray-100 dark:border-gray-800/60 my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-gray-400 shrink-0" />
                    <div>
                      <h4 className="text-base font-semibold text-gray-600 dark:text-gray-400">{session.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {session.date} • {session.duration_minutes ? `${session.duration_minutes} min` : '45 min'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
