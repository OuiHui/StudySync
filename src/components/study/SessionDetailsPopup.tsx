import { Users, Calendar, Clock, } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  };
  onJoinSession: (sessionId: string) => void;
  onTogglePlanToAttend?: (sessionId: string) => Promise<void> | void;
  currentUser?: any;
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
  currentUser 
}: SessionDetailsPopupProps) => {
  const handleJoin = () => {
    onJoinSession(session.id);
    onClose();
  };

  const handlePlanClick = async () => {
    if (onTogglePlanToAttend) {
      await onTogglePlanToAttend(session.id);
    }
  };

  const isParticipant = session.participantList?.some((p: any) => p.user_id === currentUser?.id);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
            <Badge variant={session.type === 'active' ? 'default' : 'secondary'} className="mt-2">
              {session.type === 'active' ? 'LIVE' : 'SCHEDULED'}
            </Badge>
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
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm flex items-center">
              <Users size={16} className="mr-1.5 text-gray-400" />
              {session.type === 'active' ? 'Active Participants' : 'People Planning to Attend'} ({session.participantList?.length || 0})
            </h4>
            {session.participantList && session.participantList.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {session.participantList.map((p: any) => {
                  const pName = p.profiles?.display_name || 'Anonymous User';
                  const pInitials = getInitials(pName);
                  return (
                    <div key={p.user_id} className="flex items-center space-x-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatarColorClass(pName)}`}>
                        {pInitials}
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {pName} {p.user_id === currentUser?.id ? ' (you)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {session.type === 'active' ? 'No active participants' : 'No one planning to attend yet'}
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
            ) : (
              <Button 
                onClick={handlePlanClick}
                className={`flex-1 ${
                  isParticipant 
                    ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-gray-100' 
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