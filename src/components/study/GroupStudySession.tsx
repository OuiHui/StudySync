import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StudyTimer } from './StudyTimer';
import { ParticipantsList } from './ParticipantsList';
import { SessionStats } from './SessionStats';
import { SessionNotes } from './SessionNotes';
import { StudyGoals } from './StudyGoals';
import { ColorCustomizer } from '@/components/common/settings/ColorCustomizer';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface GroupStudySessionProps {
  onLeaveSession: () => void;
  onTimerUpdate?: (isActive: boolean, timeLeft: number, initialTime?: number, mode?: 'work' | 'break') => void;
  onThemeChange?: (theme: any) => void;
  currentTheme?: any;
  sessionId?: string;
}

export const GroupStudySession = ({ onLeaveSession, onTimerUpdate, onThemeChange, currentTheme, sessionId }: GroupStudySessionProps) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const [privateChatOpen, setPrivateChatOpen] = useState(false);
  const [privateChatParticipant, setPrivateChatParticipant] = useState<any>(null);

  const participants = [
    { id: '1', name: 'Sarah Johnson', status: 'Active', avatar: 'bg-blue-500' },
    { id: '2', name: 'Mike Chen', status: 'Active', avatar: 'bg-green-500' },
    { id: '3', name: 'Emma Wilson', status: 'Away', avatar: 'bg-purple-500' },
    { id: '4', name: 'John Smith', status: 'Active', avatar: 'bg-red-500' },
    { id: '5', name: 'Lisa Brown', status: 'Active', avatar: 'bg-yellow-500' },
    { id: '6', name: 'David Lee', status: 'Away', avatar: 'bg-pink-500' },
  ];

  const goals = [
    { id: '1', title: 'Complete Chapter 7', description: 'Integration techniques', progress: 75, completed: false },
    { id: '2', title: 'Solve Problem Set', description: '10 practice problems', progress: 40, completed: false },
    { id: '3', title: 'Review Concepts', description: 'Key formulas and theorems', progress: 100, completed: true },
  ];

  const handleChatWithParticipant = (participant: any) => {
    setPrivateChatParticipant(participant);
    setPrivateChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      
      <div className="p-6">
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeaveSession}
                className="dark:text-white dark:hover:bg-gray-700"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">Advanced Mathematics Study Session</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Collaborative learning session</p>
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button
                onClick={() => setNotesOpen(true)}
                variant="outline"
                size="sm"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <BookOpen size={16} className="mr-1" />
                <span className="hidden sm:inline">Shared Notes</span>
              </Button>
              <ColorCustomizer 
                onThemeChange={onThemeChange || (() => {})} 
                currentTheme={currentTheme || {
                  name: 'Default Blue',
                  primary: '#3b82f6',
                  secondary: '#1e40af',
                  gradient: 'from-blue-50 to-indigo-100'
                }}
              />
            </div>
          </div>

          <ParticipantsList 
            participants={participants} 
            onChatWithParticipant={handleChatWithParticipant}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StudyTimer onTimerUpdate={onTimerUpdate} isGroupSession={true} sessionId={sessionId} />
            <SessionStats />
          </div>

          <StudyGoals goals={goals} />

        </div>
      </div>


      <SessionNotes
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
      />
    </div>
  );
};