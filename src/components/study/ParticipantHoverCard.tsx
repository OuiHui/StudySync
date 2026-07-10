
import { useState } from 'react';
import { MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';

interface Participant {
  id: string;
  name: string;
  status: string;
  avatar: string;
}

interface ParticipantHoverCardProps {
  participant: Participant;
  onChatClick: (participant: Participant) => void;
}

export const ParticipantHoverCard = ({ participant, onChatClick }: ParticipantHoverCardProps) => {
  const { openProfile } = useUserProfileModal();
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">
          <div className={`w-9 h-9 ${participant.avatar} rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all shadow-sm`}>
            <span className="text-white font-semibold text-xs">
              {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 ${participant.avatar} rounded-full flex items-center justify-center`}>
                <span className="text-white font-medium text-sm">
                  {participant.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-semibold dark:text-white">{participant.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{participant.status}</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Study partner in Advanced Mathematics group
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
           <Button 
            size="sm" 
            variant="outline" 
            onClick={() => openProfile(participant.id)}
            className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          >
            <User size={14} className="mr-1" />
            View Profile
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => onChatClick(participant)}
          >
            <MessageSquare size={14} className="mr-1" />
            Chat
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
