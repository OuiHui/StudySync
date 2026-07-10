
import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Play, Eye, Loader2, Edit, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateSessionDialog } from '@/components/study/CreateSessionDialog';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { SessionDetailsPopup } from '@/components/study/SessionDetailsPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailableSessions } from '@/hooks/useAvailableSessions';
import { StudySessionsService } from '@/services/database';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { StudyCalendar } from '@/components/calendar/StudyCalendar';

interface StudySession {
  id: string;
  groupName: string;
  course: string;
  participants: number;
  participantList: any[];
  startTime: string;
  timeRange: string;
  duration: string;
  type: 'active' | 'planned';
  description: string;
  created_by?: string;
  max_participants?: number;
  group_id?: string;
  status?: string;
  title?: string;
  hostName: string;
  hostInitials: string;
  hostAvatarUrl?: string | null;
  isHost: boolean;
  study_groups?: {
    name: string;
    subject?: string;
  };
}

interface AvailableSessionsListProps {
  onJoinSession: (sessionId: string) => void;
}

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarColorClass = (name: string) => {
  const colors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-sky-500 text-white',
    'bg-violet-500 text-white',
    'bg-orange-500 text-white'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const formatCardTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', ''); // e.g. 7:31pm
  return `${month} ${day}, ${timeStr}`;
};

const getDurationDisplay = (startStr: string, endStr: string, isLive: boolean) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const now = new Date();
  const diffMs = isLive ? (end.getTime() - now.getTime()) : (end.getTime() - start.getTime());
  
  if (diffMs <= 0) return isLive ? '0m left' : '0 minutes';
  
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / (60000 * 60));
  const diffDays = Math.round(diffMs / (60000 * 60 * 24));
  
  const suffix = isLive ? ' left' : '';
  
  if (diffDays >= 1) {
    return isLive ? `${diffDays}d${suffix}` : `${diffDays} days`;
  } else if (diffHours >= 1) {
    return isLive ? `${diffHours}h${suffix}` : `${diffHours} hours`;
  } else {
    return isLive ? `${diffMinutes}m${suffix}` : `${diffMinutes} minutes`;
  }
};

export const AvailableSessionsList = ({ onJoinSession }: AvailableSessionsListProps) => {
  const { user } = useAuth();
  const { openProfile } = useUserProfileModal();
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const { sessions, loading, error, loadSessions } = useAvailableSessions();

  // Use fetched sessions
  const displaySessions = sessions.map(session => {
    const start = new Date(session.scheduled_start);
    const end = new Date(session.scheduled_end);
    const isLive = (
      ['active', 'running', 'paused'].includes(session.status) ||
      (session.status === 'scheduled' &&
       start <= new Date() &&
       end >= new Date())
    );

    const timeRangeStr = `${formatCardTime(session.scheduled_start)} → ${formatCardTime(session.scheduled_end)}`;
    
    // Find host display name
    const hostProfile = session.profiles;
    const hostName = hostProfile?.display_name || session.session_participants?.find((p: any) => p.user_id === session.created_by)?.profiles?.display_name || 'Anonymous Host';
    const hostInitials = getInitials(hostName);
    const hostAvatarUrl = hostProfile?.avatar_url || null;

    return {
      ...session, // Preserve all original session data
      id: session.id,
      groupName: session.study_groups?.name || session.title || 'Unknown Group',
      course: session.subject || session.study_groups?.subject || 'General Study',
      participants: session.participant_count || 0,
      participantList: session.session_participants || [],
      startTime: formatCardTime(session.scheduled_start),
      timeRange: timeRangeStr,
      duration: getDurationDisplay(session.scheduled_start, session.scheduled_end, isLive),
      type: isLive ? 'active' as const : 'planned' as const,
      description: session.description || '',
      title: session.title, // Ensure we have the actual session title
      hostName,
      hostInitials,
      hostAvatarUrl,
      isHost: session.created_by === user?.id
    };
  });

  const activeSessions = displaySessions.filter(s => s.type === 'active');
  const plannedSessions = displaySessions.filter(s => s.type === 'planned');

  useEffect(() => {
    if (selectedSession) {
      const updated = displaySessions.find(s => s.id === selectedSession.id);
      if (updated) {
        setSelectedSession(updated);
      }
    }
  }, [sessions]);

  const handleTogglePlanToAttend = async (sessionId: string) => {
    if (!user) return;
    const session = displaySessions.find(s => s.id === sessionId);
    if (!session) return;
    const isParticipant = session.participantList.some((p: any) => p.user_id === user.id);
    try {
      if (isParticipant) {
        await StudySessionsService.leaveSession(sessionId);
      } else {
        await StudySessionsService.joinSession(sessionId);
      }
      await loadSessions();
    } catch (err) {
      console.error('Error toggling plan to attend:', err);
    }
  };

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
          <StudyCalendar compact={true} />
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
            {activeSessions.map((session) => {
              const subtitleText = session.study_groups?.name && session.title 
                ? `${session.study_groups.name} · ${session.course}`
                : session.course;

              return (
                <Card key={session.id} className="flex flex-col h-full border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <CardContent className="p-4 flex flex-col flex-1 justify-between h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-snug">
                            {session.title || session.groupName}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            {subtitleText}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ml-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Live
                        </span>
                      </div>                      {/* Host display */}
                      <button
                        onClick={() => session.created_by && openProfile(session.created_by)}
                        className="flex items-center space-x-2 mt-3 text-left focus:outline-none cursor-pointer group"
                      >
                        <div className="relative w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-indigo-700/10 group-hover:scale-105 active:scale-95 transition-transform">
                          {session.hostAvatarUrl ? (
                            <img src={session.hostAvatarUrl} alt={session.hostName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            session.hostInitials
                          )}
                          <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-0.5 border border-white dark:border-gray-800 shadow-sm flex items-center justify-center">
                            <Star size={8} fill="currentColor" />
                          </span>
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          Hosted by {session.hostName}{session.isHost ? ' (you)' : ''}
                        </span>
                      </button>
                      
                      {session.description && (
                        <p className="text-xs text-gray-800 dark:text-gray-100 mt-3 leading-relaxed">
                          {session.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between text-xs text-gray-505 dark:text-gray-400 mb-3 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <span>{session.timeRange}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>{session.duration}</span>
                        </div>
                      </div>                      {/* Overlapping participants group */}
                      <div className="flex items-center space-x-2 mb-3.5 mt-1 select-none h-6">
                        {session.participantList.length > 0 ? (
                          <>
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {session.participantList.slice(0, 3).map((p: any) => {
                                const pName = p.profiles?.display_name || 'Anonymous';
                                const pInitials = getInitials(pName);
                                return (
                                  <div 
                                    key={p.user_id} 
                                    className={`inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-[9px] font-bold z-10 ${getAvatarColorClass(pName)}`}
                                    title={pName}
                                  >
                                    {pInitials}
                                  </div>
                                );
                              })}
                              {session.participantList.length > 3 && (
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-500 text-white flex items-center justify-center text-[9px] font-bold z-20">
                                  +{session.participantList.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                              {session.participants} active
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Users size={14} className="mr-1.5 shrink-0" />
                            <span className="text-xs font-medium">
                              No Active Participants
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex-1 dark:border-gray-600 dark:text-gray-305 dark:hover:bg-gray-700"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye size={14} className="mr-1.5" />
                          Details
                        </Button>
                        <Button 
                          onClick={() => handleJoinSession(session.id)}
                          className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-medium"
                          size="sm"
                        >
                          Join session
                        </Button>
                        {session.isHost && (
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
                              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Edit size={14} />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
            {plannedSessions.map((session) => {
              const subtitleText = session.study_groups?.name && session.title 
                ? `${session.study_groups.name} · ${session.course}`
                : session.course;

              return (
                <Card key={session.id} className="flex flex-col h-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <CardContent className="p-4 flex flex-col flex-1 justify-between h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-snug">
                            {session.title || session.groupName}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            {subtitleText}
                          </p>
                        </div>
                        <span className="inline-flex items-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ml-2">
                          Scheduled
                        </span>
                      </div>

                      {/* Host display */}
                      <button
                        onClick={() => session.created_by && openProfile(session.created_by)}
                        className="flex items-center space-x-2 mt-3 text-left focus:outline-none cursor-pointer group"
                      >
                        <div className="relative w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-indigo-700/10 group-hover:scale-105 active:scale-95 transition-transform">
                          {session.hostAvatarUrl ? (
                            <img src={session.hostAvatarUrl} alt={session.hostName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            session.hostInitials
                          )}
                          <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-0.5 border border-white dark:border-gray-800 shadow-sm flex items-center justify-center">
                            <Star size={8} fill="currentColor" />
                          </span>
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          Hosted by {session.hostName}{session.isHost ? ' (you)' : ''}
                        </span>
                      </button>
                      
                      {session.description && (
                        <p className="text-xs text-gray-800 dark:text-gray-100 mt-3 leading-relaxed">
                          {session.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between text-xs text-gray-505 dark:text-gray-400 mb-3 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <span>{session.timeRange}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>{session.duration}</span>
                        </div>
                      </div>
                                          {/* Overlapping participants group */}
                      <div className="flex items-center space-x-2 mb-3.5 mt-1 select-none h-6">
                        {session.participantList.length > 0 ? (
                          <>
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {session.participantList.slice(0, 3).map((p: any) => {
                                const pName = p.profiles?.display_name || 'Anonymous';
                                const pInitials = getInitials(pName);
                                return (
                                  <div 
                                    key={p.user_id} 
                                    className={`inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-[9px] font-bold z-10 ${getAvatarColorClass(pName)}`}
                                    title={pName}
                                  >
                                    {pInitials}
                                  </div>
                                );
                              })}
                              {session.participantList.length > 3 && (
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-500 text-white flex items-center justify-center text-[9px] font-bold z-20">
                                  +{session.participantList.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                              {session.participants} planning to attend
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Users size={14} className="mr-1.5 shrink-0" />
                            <span className="text-xs font-medium">
                              No one planning to attend yet
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye size={14} className="mr-1.5" />
                          Details
                        </Button>
                        {session.participantList.some((p: any) => p.user_id === user?.id) ? (
                          <Button 
                            onClick={() => handleTogglePlanToAttend(session.id)}
                            className="flex-[2] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-100 font-medium"
                            size="sm"
                          >
                            Cancel plan
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleTogglePlanToAttend(session.id)}
                            className="flex-[2] bg-blue-500 hover:bg-blue-600 text-white font-medium"
                            size="sm"
                          >
                            Plan to attend
                          </Button>
                        )}
                        {session.isHost && (
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
                              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                                <Edit size={14} />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
          onTogglePlanToAttend={handleTogglePlanToAttend}
          currentUser={user}
        />
      )}
    </div>
  );
};
