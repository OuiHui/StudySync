import { Calendar, Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GroupSessionsTabProps {
  sessions: any[];
  attendingSessions: string[];
  onAttendSession: (id: string) => void;
  onCancelSession: (id: string) => void;
}

export const GroupSessionsTab = ({ sessions, attendingSessions, onAttendSession, onCancelSession }: GroupSessionsTabProps) => {
  const displaySessions = sessions.map(session => {
    const sessionDate = new Date(session.scheduled_start);
    const now = new Date();
    const isPast = sessionDate < now;
    
    return {
      ...session,
      id: session.id,
      title: session.title,
      date: sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: session.duration_minutes ? `${session.duration_minutes} minutes` : '60 minutes',
      attendees: session.participant_count || 0,
      type: (
        ['active', 'running', 'paused'].includes(session.status) ||
        (session.status === 'scheduled' &&
         sessionDate <= now &&
         new Date(session.scheduled_end) >= now)
      ) ? 'active' as const : 'planned' as const,
      isPast
    };
  });

  if (displaySessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No study sessions scheduled</h3>
        <p className="text-gray-600 dark:text-gray-300">This group doesn't have any study sessions yet. Check back later or create one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displaySessions.map((session) => (
        <Card key={session.id} className={`border-0 shadow-md dark:bg-gray-800 ${session.isPast ? 'opacity-60' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800 dark:text-white">{session.title}</CardTitle>
              {session.isPast && (
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Past</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar size={14} className="mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{session.date} at {session.time}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users size={14} className="mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{session.attendees} attendees</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Duration: {session.duration}</div>
              
              {session.type === 'planned' && !session.isPast && (
                <div className="flex items-center text-sm">
                  {attendingSessions.includes(session.id) ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center">
                      <UserCheck size={14} className="mr-1" /> Planning to attend
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Not attending</span>
                  )}
                </div>
              )}
            </div>
            
            {session.isPast ? (
              <Button disabled className="w-full mt-4 opacity-50 cursor-not-allowed">Session Ended</Button>
            ) : session.type === 'active' ? (
              <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">Join Session</Button>
            ) : (
              <div className="mt-4 flex space-x-2">
                {attendingSessions.includes(session.id) ? (
                  <Button onClick={() => onCancelSession(session.id)} variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20">
                    <UserX size={14} className="mr-1" /> Cancel
                  </Button>
                ) : (
                  <Button onClick={() => onAttendSession(session.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                    <UserCheck size={14} className="mr-1" /> Attend
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
