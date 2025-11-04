
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantHoverCard } from './ParticipantHoverCard';

interface Participant {
  id: string;
  name: string;
  status: string;
  avatar: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  onChatWithParticipant?: (participant: Participant) => void;
}

export const ParticipantsList = ({ participants, onChatWithParticipant }: ParticipantsListProps) => {
  const handleChatClick = (participant: Participant) => {
    onChatWithParticipant?.(participant);
  };

  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-800 dark:text-white">
          <Users size={20} className="mr-2 text-blue-600" />
          Active Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {participants.map((participant) => (
            <ParticipantHoverCard
              key={participant.id}
              participant={participant}
              onChatClick={handleChatClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
