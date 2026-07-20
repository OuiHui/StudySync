import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, ArrowRight, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ActiveSessionBannerProps {
  session: {
    id: string;
    title: string;
    subject?: string | null;
    status: string;
    participant_count?: number;
    profiles?: {
      display_name?: string;
      avatar_url?: string;
    } | null;
  };
  groupName: string;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({ session, groupName }) => {
  const navigate = useNavigate();

  const handleJoinSession = () => {
    navigate(`/group-study-session?id=${session.id}`);
  };

  return (
    <div className="mx-4 my-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start sm:items-center gap-3">
        {/* Pulsing indicator icon */}
        <div className="relative shrink-0 mt-0.5 sm:mt-0">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium text-[11px] px-2 py-0">
              <Radio className="w-3 h-3 mr-1 animate-pulse" /> LIVE NOW
            </Badge>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
              {session.title || `${groupName} Study Session`}
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 flex items-center gap-2">
            {session.subject && (
              <span className="font-medium text-gray-700 dark:text-gray-200">{session.subject}</span>
            )}
            {session.profiles?.display_name && (
              <span>• Host: {session.profiles.display_name}</span>
            )}
            {typeof session.participant_count === 'number' && session.participant_count > 0 && (
              <span className="flex items-center gap-1">
                • <Users className="w-3 h-3 inline" /> {session.participant_count}
              </span>
            )}
          </p>
        </div>
      </div>

      <Button
        onClick={handleJoinSession}
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-1.5 self-end sm:self-center shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <span>Join Session</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
