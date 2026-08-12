import { Users, LogOut, Shield, ShieldAlert, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParticipantHoverCard } from './ParticipantHoverCard';

interface Participant {
  user_id: string;
  role: string;
  status: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    user_id: string;
  } | null;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: string;
  isHost: boolean;
  onToggleStatus?: () => void;
  onKickParticipant?: (userId: string) => void;
  onChatWithParticipant?: (participant: any) => void;
}

export const ParticipantsList = ({
  participants,
  currentUserId,
  isHost,
  onToggleStatus,
  onKickParticipant,
  onChatWithParticipant
}: ParticipantsListProps) => {
  const currentUserParticipant = participants.find(p => p.user_id === currentUserId);
  const activeParticipants = participants.filter(p => p.status !== 'invited' && p.status !== 'accepted');
  const planningParticipants = participants.filter(p => p.status === 'accepted');
  const invitedParticipants = participants.filter(p => p.status === 'invited');

  return (
    <Card className="border border-border shadow-sm bg-card text-card-foreground backdrop-blur-sm">
      <CardContent className="p-3 space-y-3">
        {/* Active participants section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-brand" />
            <span className="text-sm font-semibold text-card-foreground">
              Active Study Group ({activeParticipants.length})
            </span>
          </div>

          {/* Horizontal scroll list of active avatars and names */}
          <div className="flex items-center space-x-3 overflow-x-auto py-1 flex-1 px-2 justify-start max-w-xl">
            {activeParticipants.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No active study buddies yet</span>
            ) : (
              activeParticipants.map((p) => {
                const displayName = p.profiles?.display_name || 'Anonymous User';
                const mappedParticipantForHover = {
                  id: p.user_id,
                  name: displayName,
                  status: p.status === 'active' ? 'Active' : 'Away',
                  avatar: p.role === 'host' ? 'bg-brand' : 'bg-brand/80',
                  role: p.role
                };
                const isSelf = p.user_id === currentUserId;

                return (
                  <div
                    key={p.user_id}
                    className="relative group flex items-center bg-muted/60 rounded-full pl-1 pr-3 py-1 border border-border space-x-2 shrink-0 select-none"
                  >
                    <div className="relative shrink-0">
                      <ParticipantHoverCard
                        participant={mappedParticipantForHover}
                        onChatClick={() => onChatWithParticipant?.(mappedParticipantForHover)}
                      />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                        p.status === 'active' ? 'bg-green-500' : 'bg-amber-400'
                      }`} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {displayName}
                    </span>
                    {p.role === 'host' && (
                      <Shield size={12} className="text-brand shrink-0" />
                    )}
                    {isHost && !isSelf && (
                      <button
                        onClick={() => onKickParticipant?.(p.user_id)}
                        className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full p-0.5 transition-all shrink-0"
                        title="Remove from session"
                      >
                        <Ban size={11} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {currentUserParticipant && (
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                My Status: <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{currentUserParticipant.status}</span>
              </span>
            </div>
          )}
        </div>

        {/* Planning and Invited sub-rows */}
        {(planningParticipants.length > 0 || invitedParticipants.length > 0) && (
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 text-xs">
            {planningParticipants.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-500 dark:text-gray-400">Planning to Attend:</span>
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {planningParticipants.map((p) => {
                    const name = p.profiles?.display_name || 'Anonymous';
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <div 
                        key={p.user_id}
                        className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold"
                        title={`${name} (Planning)`}
                      >
                        {initials}
                      </div>
                    );
                  })}
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-semibold">{planningParticipants.length}</span>
              </div>
            )}

            {invitedParticipants.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-500 dark:text-gray-400">Invited:</span>
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {invitedParticipants.map((p) => {
                    const name = p.profiles?.display_name || 'Anonymous';
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <div 
                        key={p.user_id}
                        className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-400 text-white flex items-center justify-center text-[8px] font-bold"
                        title={`${name} (Invited)`}
                      >
                        {initials}
                      </div>
                    );
                  })}
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-semibold">{invitedParticipants.length}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
