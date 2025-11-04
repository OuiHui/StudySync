
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleSessionPopup, StudyMaterialsPopup, SessionSettingsPopup } from './SessionStatsPopups';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { useState } from 'react';



export const SessionStats = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [privateChatOpen, setPrivateChatOpen] = useState(false);
  const [privateChatParticipant, setPrivateChatParticipant] = useState<any>(null);

  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScheduleSessionPopup />
        <StudyMaterialsPopup />
        <SessionSettingsPopup />
        <Button
          onClick={() => setChatOpen(true)}
          variant="outline"
          size="sm"
          className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <MessageSquare size={16} className="mr-2" />
          Group Chat
        </Button>
      </CardContent>
      <ChatPopup
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        groupName="Advanced Mathematics"
      />

      <ChatPopup
        isOpen={privateChatOpen}
        onClose={() => setPrivateChatOpen(false)}
        groupName={privateChatParticipant?.name || "Private Chat"}
      />
    </Card>

     
  );
};
