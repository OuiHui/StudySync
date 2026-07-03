
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SessionProgress } from './SessionProgress';
import { useTimer } from '@/hooks/useTimer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ReflectionDialog } from './ReflectionDialog';
import { StudySessionsMutations } from '@/services/studySessions/mutations';

interface StudyTimerProps {
  onTimerUpdate?: (
    isActive: boolean,
    timeLeft: number,
    initialTime?: number,
    mode?: 'work' | 'break',
    currentCycle?: number,
    pauseLogs?: { paused_at: string; resumed_at: string | null }[]
  ) => void;
  isGroupSession?: boolean;
  sessionId?: string;
}

export const StudyTimer = ({ onTimerUpdate, isGroupSession = false, sessionId }: StudyTimerProps) => {
  const { user } = useAuth();
  const [isHost, setIsHost] = useState(true);
  const [sessionSubject, setSessionSubject] = useState<string | null>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);

  useEffect(() => {
    const checkHostStatus = async () => {
      if (!sessionId || !user) return;
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .select('created_by, subject')
          .eq('id', sessionId)
          .single();
        if (!error && data) {
          setIsHost(data.created_by === user.id);
          if (data.subject) {
            setSessionSubject(data.subject);
          }
        }
      } catch (err) {
        console.error('Error checking host status:', err);
      }
    };
    checkHostStatus();
  }, [sessionId, user]);

  // Get global timer state from window object (set by Index.tsx)
  const globalTimerState = (window as any).globalTimerState;
  
  const [currentTopic, setCurrentTopic] = useState('Integration by Parts - Advanced Techniques');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopic, setEditedTopic] = useState(currentTopic);
  
  const {
    timeLeft,
    isActive,
    mode,
    sessions,
    sessionGoal,
    progress,
    currentCycle,
    toggleTimer,
    resetTimer,
    setSessionGoal,
    workDuration
  } = useTimer({ 
    onTimerUpdate, 
    globalTimerState: isGroupSession ? globalTimerState : undefined,
    sessionId,
    isHost
  });

  const handleReflectionSubmit = async (rating: number, notes: string) => {
    setSavingReflection(true);
    try {
      if (sessionId) {
        await StudySessionsMutations.updateSession(sessionId, {
          reflection_rating: rating,
          reflection_notes: notes,
          status: 'finished',
          actual_end: new Date().toISOString()
        });
      } else {
        const reflection = { rating, notes, completedAt: new Date().toISOString() };
        console.log('Saved local reflection:', reflection);
      }
      resetTimer();
    } catch (err) {
      console.error('Failed to submit reflection:', err);
      throw err;
    } finally {
      setSavingReflection(false);
    }
  };

  const handleTopicEdit = () => {
    setEditedTopic(currentTopic);
    setIsEditingTopic(true);
  };

  const handleTopicSave = () => {
    setCurrentTopic(editedTopic);
    setIsEditingTopic(false);
  };

  const handleTopicCancel = () => {
    setEditedTopic(currentTopic);
    setIsEditingTopic(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-xl text-gray-800 dark:text-white">
            {mode === 'work' ? '🍅 Group Study Timer' : '☕ Break Time'}
            {sessionSubject && <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">Subject: {sessionSubject}</span>}
            {currentCycle && <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">Cycle {currentCycle}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-600"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`${mode === 'work' ? 'text-blue-500' : 'text-green-500'}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-white">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {mode === 'work' ? 'Focus Time' : 'Break Time'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {isHost ? (
              <>
                <Button
                  onClick={toggleTimer}
                  size="lg"
                  className={`${mode === 'work' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                  {isActive ? <Pause size={20} /> : <Play size={20} />}
                  <span className="ml-2">{isActive ? 'Pause' : 'Start'}</span>
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <RotateCcw size={20} />
                  <span className="ml-2">Reset</span>
                </Button>
                {(isActive || timeLeft < workDuration) && (
                  <Button
                    onClick={() => setReflectionOpen(true)}
                    variant="secondary"
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Finish Session
                  </Button>
                )}
              </>
            ) : (
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-900/30">
                ⏳ Host-controlled session. Syncing timer...
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800 dark:text-white">Current Topic</h3>
              {!isEditingTopic && (
                <Button
                  onClick={handleTopicEdit}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Edit2 size={14} />
                </Button>
              )}
            </div>
            {isEditingTopic ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedTopic}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  className="text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTopicSave();
                    if (e.key === 'Escape') handleTopicCancel();
                  }}
                  autoFocus
                />
                <Button
                  onClick={handleTopicSave}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <Check size={14} />
                </Button>
                <Button
                  onClick={handleTopicCancel}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">{currentTopic}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <SessionProgress
        sessions={sessions}
        sessionGoal={sessionGoal}
        onSessionGoalChange={setSessionGoal}
      />

      <ReflectionDialog
        isOpen={reflectionOpen}
        onClose={() => setReflectionOpen(false)}
        onSubmit={handleReflectionSubmit}
        loading={savingReflection}
      />
    </div>
  );
};
