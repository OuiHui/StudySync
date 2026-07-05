
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleSessionPopup, StudyMaterialsPopup, SessionSettingsPopup } from './SessionStatsPopups';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { useState } from 'react';



export const SessionStats = () => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScheduleSessionPopup />
        <StudyMaterialsPopup />
        <SessionSettingsPopup />
      </CardContent>
    </Card>

     
  );
};
