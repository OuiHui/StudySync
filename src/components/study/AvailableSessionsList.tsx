
import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Play, Eye, Loader2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateSessionDialog } from '@/components/study/CreateSessionDialog';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { SessionDetailsPopup } from '@/components/study/SessionDetailsPopup';
import { StudySessionsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface StudySession {
  id: string;
  groupName: string;
  subject: string;
  participants: number;
  startTime: string;
  duration: string;
  type: 'active' | 'planned';
  description: string;
}

interface AvailableSessionsListProps {
  onJoinSession: (sessionId: string) => void;
}

export const AvailableSessionsList = ({ onJoinSession }: AvailableSessionsListProps) => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const availableSessions = await StudySessionsService.getAvailableSessions();
      setSessions(availableSessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Unable to load study sessions. Please check your internet connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Use fetched sessions
  const displaySessions = sessions.map(session => ({
    ...session, // Preserve all original session data
    id: session.id,
    groupName: session.study_groups?.name || session.title || 'Unknown Group',
    subject: session.study_groups?.subject || 'General Study',
    participants: session.participant_count || 0,
    startTime: new Date(session.scheduled_start).toLocaleTimeString(),
    duration: session.duration_minutes ? `${session.duration_minutes} minutes` : '60 minutes',
    type: session.status === 'active' ? 'active' as const : 'planned' as const,
    description: session.description || 'Study session'
  }));

  const activeSessions = displaySessions.filter(s => s.type === 'active');
  const plannedSessions = displaySessions.filter(s => s.type === 'planned');

  const handleJoinSession = (sessionId: string) => {
    console.log('Joining session:', sessionId);
    onJoinSession(sessionId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Study Sessions</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Join or create collaborative study sessions</p>
        </div>
        <CreateSessionDialog onSessionCreated={loadSessions} />
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading study sessions...</span>
        </div>
      ) : (
        <>
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <Play size={20} className="mr-2" />
                Live Sessions ({activeSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Play size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No Live Sessions</h3>
                  <p className="text-gray-600 dark:text-gray-300">No active study sessions at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <Card key={session.id} className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{session.groupName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{session.subject}</p>
                    </div>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
                  </div>
                  
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">{session.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      <span>{session.participants} active</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{session.duration}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleJoinSession(session.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    size="sm"
                  >
                    Join Session
                  </Button>
                </CardContent>
              </Card>
            ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600 dark:text-blue-400">
                <Calendar size={20} className="mr-2" />
                Upcoming Sessions ({plannedSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plannedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No Upcoming Sessions</h3>
                  <p className="text-gray-600 dark:text-gray-300">No scheduled study sessions</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plannedSessions.map((session) => (
              <Card key={session.id} className="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{session.groupName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{session.subject}</p>
                    </div>
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">SCHEDULED</span>
                  </div>
                  
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">{session.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>Starts {session.startTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{session.duration}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setSelectedSession(session)}
                    >
                      <Eye size={14} className="mr-1" />
                      Details
                    </Button>
                    {session.created_by === user?.id ? (
                      <EditSessionDialog 
                        session={{
                          id: session.id,
                          title: session.title || session.groupName,
                          description: session.description,
                          scheduled_start: session.scheduled_start,
                          scheduled_end: session.scheduled_end,
                          max_participants: session.max_participants,
                          group_id: session.group_id,
                          status: session.status
                        }}
                        onSessionUpdated={loadSessions}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                        }
                      />
                    ) : (
                      <Button 
                        onClick={() => handleJoinSession(session.id)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        size="sm"
                      >
                        Schedule
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Session Details Popup */}
      {selectedSession && (
        <SessionDetailsPopup
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          onJoinSession={onJoinSession}
        />
      )}
    </div>
  );
};
