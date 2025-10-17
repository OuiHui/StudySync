
import { useState } from 'react';
import { Users, Calendar, Clock, Play, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateSessionDialog } from '@/components/study/CreateSessionDialog';
import { SessionDetailsPopup } from '@/components/study/SessionDetailsPopup';

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
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [sessions] = useState<StudySession[]>([
    {
      id: '1',
      groupName: 'Advanced Mathematics',
      subject: 'Calculus & Linear Algebra',
      participants: 12,
      startTime: '2:00 PM',
      duration: '2 hours',
      type: 'active',
      description: 'Deep dive into integration techniques and vector spaces'
    },
    {
      id: '2',
      groupName: 'Physics Study Circle',
      subject: 'Quantum Mechanics',
      participants: 8,
      startTime: '4:30 PM',
      duration: '1.5 hours',
      type: 'planned',
      description: 'Exploring wave functions and quantum states'
    },
    {
      id: '3',
      groupName: 'Chemistry Lab Prep',
      subject: 'Organic Chemistry',
      participants: 15,
      startTime: '7:00 PM',
      duration: '3 hours',
      type: 'planned',
      description: 'Laboratory safety and experimental procedures'
    },
    {
      id: '4',
      groupName: 'Literature Discussion',
      subject: 'Modern Poetry',
      participants: 6,
      startTime: '6:00 PM',
      duration: '1 hour',
      type: 'active',
      description: 'Analyzing contemporary poetic techniques'
    }
  ]);

  const activeSessions = sessions.filter(s => s.type === 'active');
  const plannedSessions = sessions.filter(s => s.type === 'planned');

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
        <CreateSessionDialog onSessionCreated={() => window.location.reload()} />
      </div>

      <Card className="border-0 shadow-lg dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-green-600 dark:text-green-400">
            <Play size={20} className="mr-2" />
            Live Sessions ({activeSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <Button 
                      onClick={() => handleJoinSession(session.id)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

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
