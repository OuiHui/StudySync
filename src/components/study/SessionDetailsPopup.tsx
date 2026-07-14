import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { EditSessionDialog } from '@/components/study/EditSessionDialog';
import { StudySessionsService } from '@/services/database';

interface SessionDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    groupName: string;
    course: string;
    participants: number;
    startTime: string;
    duration: string;
    type: 'active' | 'planned';
    description: string;
    participantList?: any[];
    isHost?: boolean;
    scheduled_start?: string;
    scheduled_end?: string;
    max_participants?: number;
    group_id?: string;
    status?: string;
    title?: string;
  };
  onJoinSession: (sessionId: string) => void;
  onTogglePlanToAttend?: (sessionId: string) => Promise<void> | void;
  currentUser?: any;
  onSessionUpdated?: () => void;
}

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

export const SessionDetailsPopup = ({ 
  isOpen, 
  onClose, 
  session, 
  onJoinSession, 
  onTogglePlanToAttend, 
  currentUser,
  onSessionUpdated
}: SessionDetailsPopupProps) => {
  const { openProfile } = useUserProfileModal();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Reset confirmation state after 3 seconds
  useEffect(() => {
    if (isConfirmingCancel) {
      const timer = setTimeout(() => {
        setIsConfirmingCancel(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingCancel]);

  const handleCancelSession = async () => {
    try {
      await StudySessionsService.deleteSession(session.id);
      setIsConfirmingCancel(false);
      onClose();
      if (onSessionUpdated) {
        onSessionUpdated();
      }
    } catch (err: any) {
      console.error('Failed to cancel session:', err);
    }
  };
  const handleJoin = () => {
    onJoinSession(session.id);
    onClose();
  };

  const handlePlanClick = async () => {
    if (onTogglePlanToAttend) {
      await onTogglePlanToAttend(session.id);
    }
  };

  const isParticipant = session.participantList?.some((p: any) => p.user_id === currentUser?.id && p.status !== 'invited');

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const participantList = session.participantList || [];
  const activeParticipants = participantList.filter((p: any) => p.status !== 'invited' && p.status !== 'accepted');
  const planningParticipants = participantList.filter((p: any) => p.status === 'accepted' || p.role === 'host' && (p.status === 'invited' || p.status === 'accepted'));
  const invitedParticipants = participantList.filter((p: any) => p.status === 'invited');

  const renderParticipantRow = (p: any) => {
    const pName = p.profiles?.display_name || 'Anonymous User';
    const pInitials = getInitials(pName);
    const isSelf = p.user_id === currentUser?.id;
    return (
      <button
        key={p.user_id}
        onClick={() => !isSelf && openProfile(p.user_id)}
        disabled={isSelf}
        className={`flex items-center justify-between text-left focus:outline-none transition-colors w-full rounded-md p-1 ${
          isSelf 
            ? 'opacity-85 select-none' 
            : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500 dark:hover:text-blue-400 group'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-transform ${getAvatarColorClass(pName)} ${isSelf ? '' : 'group-hover:scale-105 active:scale-95'}`}>
            {p.profiles?.avatar_url ? (
              <img src={p.profiles.avatar_url} alt={pName} className="w-full h-full rounded-full object-cover" />
            ) : (
              pInitials
            )}
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
            {pName} {isSelf ? ' (you)' : ''}
          </span>
        </div>
        
        {!isSelf && (
          <ChevronRight size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        )}
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar size={20} className="mr-2" />
            Session Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Session Header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{session.groupName}</h3>
            <p className="text-gray-600 dark:text-gray-300">{session.course}</p>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant={session.type === 'active' ? 'default' : 'secondary'}>
                {session.type === 'active' ? 'LIVE' : 'SCHEDULED'}
              </Badge>
              <Badge 
                variant="outline" 
                className={session.is_public ? 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10 font-semibold' : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold'}
              >
                {session.is_public ? 'PUBLIC' : 'PRIVATE'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Description</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{session.description || <span className="text-gray-400 dark:text-gray-500 italic">No description</span>}</p>
          </div>

          {/* Session Info */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-2 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{session.duration} duration</span>
            </div>
            {session.type === 'planned' && (
              <div className="flex items-center text-sm">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Starts at {session.startTime}</span>
              </div>
            )}
          </div>

          {/* People Planning to Attend / Active Participants */}
          <div className="border-t dark:border-gray-700 pt-4 space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center mb-1">
              <Users size={16} className="mr-1.5 text-gray-400" />
              Participants & Invites
            </h4>

            {activeParticipants.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 block mb-1">
                  Active ({activeParticipants.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {activeParticipants.map((p) => renderParticipantRow(p))}
                </div>
              </div>
            )}

            {planningParticipants.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Planning to Attend ({planningParticipants.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {planningParticipants.map((p) => renderParticipantRow(p))}
                </div>
              </div>
            )}

            {invitedParticipants.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                  Invited ({invitedParticipants.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {invitedParticipants.map((p) => renderParticipantRow(p))}
                </div>
              </div>
            )}

            {participantList.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                No participants yet
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {session.type === 'active' ? (
              <Button 
                onClick={handleJoin}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Join Now
              </Button>
            ) : session.isHost ? (
              <>
                <EditSessionDialog 
                  session={{
                    id: session.id,
                    title: session.title || session.groupName,
                    description: session.description,
                    scheduled_start: session.scheduled_start || session.startTime,
                    scheduled_end: session.scheduled_end || '',
                    max_participants: session.max_participants,
                    group_id: session.group_id,
                    status: session.status,
                    is_public: session.is_public
                  }}
                  onSessionUpdated={() => {
                    onClose();
                    if (onSessionUpdated) onSessionUpdated();
                  }}
                  trigger={
                    <Button variant="outline" className="flex-1">
                      Edit Session
                    </Button>
                  }
                />
                 <Button 
                  onClick={() => {
                    if (isConfirmingCancel) {
                      handleCancelSession();
                    } else {
                      setIsConfirmingCancel(true);
                    }
                  }}
                  variant="destructive"
                  className="flex-1 font-medium text-white"
                >
                  {isConfirmingCancel ? 'Confirm Cancel' : 'Cancel Session'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handlePlanClick}
                className={`flex-1 ${
                  isParticipant 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } font-medium`}
              >
                {isParticipant ? 'Cancel Plan' : 'Plan to Attend'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};