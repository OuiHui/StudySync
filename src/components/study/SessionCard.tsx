import { Calendar, Clock, Eye, Globe, Lock, Play, Star, Users, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { isValidImageUrl } from '@/lib/utils';

export interface StudySessionCardData {
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
  is_public?: boolean | null;
  scheduled_start?: string;
  scheduled_end?: string;
  study_groups?: {
    name: string;
    subject?: string;
  };
}

interface SessionCardProps {
  session: StudySessionCardData;
  userId?: string;
  confirmingSessionId: string | null;
  onOpenProfile: (userId: string) => void;
  onOpenDetails: (session: StudySessionCardData) => void;
  onJoinSession: (sessionId: string) => void;
  onTogglePlanToAttend: (sessionId: string) => void;
  onCancelSession: (sessionId: string) => void;
  onSetConfirmingSessionId: (sessionId: string | null) => void;
  onSessionUpdated: () => void;
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
  return colors[Math.abs(hash) % colors.length];
};

export const SessionCard = ({
  session,
  userId,
  confirmingSessionId,
  onOpenProfile,
  onOpenDetails,
  onJoinSession,
  onTogglePlanToAttend,
  onCancelSession,
  onSetConfirmingSessionId,
  onSessionUpdated
}: SessionCardProps) => {
  const isLive = session.type === 'active';
  const subtitleText = session.study_groups?.name && session.title 
    ? `${session.study_groups.name} · ${session.course}`
    : session.course;

  const relevantParticipants = isLive
    ? session.participantList.filter((p: any) => p.status !== 'invited' && p.status !== 'accepted')
    : session.participantList.filter((p: any) => p.status === 'accepted' || p.role === 'host');

  const cardBorderBgClass = isLive
    ? 'border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
    : 'border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30';

  const badgeComponent = isLive ? (
    <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      Live
    </span>
  ) : (
    <span className="inline-flex items-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
      Scheduled
    </span>
  );

  return (
    <Card className={`flex flex-col h-full transition-colors ${cardBorderBgClass}`}>
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
            <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
              {badgeComponent}
              {session.is_public ? (
                <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  <Globe size={10} />
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  <Lock size={10} />
                  Private
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => session.created_by && onOpenProfile(session.created_by)}
            className="flex items-center space-x-2 mt-3 text-left focus:outline-none cursor-pointer group"
          >
            <div className="relative w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-xs font-bold text-white border border-indigo-700/10 group-hover:scale-105 active:scale-95 transition-transform">
              {session.hostAvatarUrl && isValidImageUrl(session.hostAvatarUrl) ? (
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
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
            <div className="flex items-center space-x-1.5">
              <Calendar size={13} className="text-gray-400 shrink-0" />
              <span>{session.timeRange}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <span>{session.duration}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-3.5 mt-1 select-none h-6">
            {relevantParticipants.length > 0 ? (
              <>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {relevantParticipants.slice(0, 3).map((p: any) => {
                    const pName = p.profiles?.display_name || 'Anonymous';
                    return (
                      <div 
                        key={p.user_id} 
                        className={`inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-[9px] font-bold z-10 ${getAvatarColorClass(pName)}`}
                        title={pName}
                      >
                        {getInitials(pName)}
                      </div>
                    );
                  })}
                  {relevantParticipants.length > 3 && (
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-500 text-white flex items-center justify-center text-[9px] font-bold z-20">
                      +{relevantParticipants.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {relevantParticipants.length} {isLive ? 'active' : 'planning to attend'}
                </span>
              </>
            ) : (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Users size={14} className="mr-1.5 shrink-0" />
                <span className="text-xs font-medium">
                  {isLive ? 'No Active Participants' : 'No one planning to attend yet'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              size="sm"
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => onOpenDetails(session)}
            >
              <Eye size={14} className="mr-1.5" />
              Details
            </Button>
            
            {isLive ? (
              <Button 
                onClick={() => onJoinSession(session.id)}
                className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-medium"
                size="sm"
              >
                Join session
              </Button>
            ) : session.isHost ? (
              <Button 
                onClick={() => {
                  if (confirmingSessionId === session.id) {
                    onCancelSession(session.id);
                  } else {
                    onSetConfirmingSessionId(session.id);
                  }
                }}
                variant="destructive"
                className="flex-[2] font-medium text-white"
                size="sm"
              >
                {confirmingSessionId === session.id ? "Confirm Cancel" : "Cancel Session"}
              </Button>
            ) : session.participantList.some((p: any) => p.user_id === userId && p.status !== 'invited') ? (
              <Button 
                onClick={() => onTogglePlanToAttend(session.id)}
                className="flex-[2] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-medium"
                size="sm"
              >
                Cancel plan
              </Button>
            ) : (
              <Button 
                onClick={() => onTogglePlanToAttend(session.id)}
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
                  scheduled_start: session.scheduled_start || '',
                  scheduled_end: session.scheduled_end || '',
                  max_participants: session.max_participants,
                  group_id: session.group_id,
                  status: session.status,
                  is_public: session.is_public
                }}
                onSessionUpdated={onSessionUpdated}
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
};
