import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionProgress } from './SessionProgress';
import { CurrentSettings } from './CurrentSettings';
import { SessionSettings } from './SessionSettings';
import { TimerDisplay } from './TimerDisplay';
import { SessionDetailsDialog } from './SessionDetailsDialog';
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
  const [sessionCourse, setSessionCourse] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('Group Study Session');
  const [hostName, setHostName] = useState<string>('');
  const [startTime, setStartTime] = useState<string | null>(null);

  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const checkHostStatus = async () => {
      if (!sessionId || !user) return;
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .select(`
            created_by, 
            subject, 
            actual_start, 
            title
          `)
          .eq('id', sessionId)
          .single();
        if (!error && data) {
          setIsHost(data.created_by === user.id);
          if (data.subject) {
            setSessionCourse(data.subject);
          }
          if (data.title) {
            setSessionTitle(data.title);
          }
          if (data.actual_start) {
            setStartTime(data.actual_start);
          }
          
          if (data.created_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', data.created_by)
              .maybeSingle();
            if (profileData?.display_name) {
              setHostName(profileData.display_name);
            }
          }
        }
      } catch (err) {
        console.error('Error checking host status:', err);
      }
    };
    checkHostStatus();
  }, [sessionId, user]);

  const globalTimerState = (window as any).globalTimerState;

  const {
    workDuration,
    breakDuration,
    longBreakDuration,
    timeLeft,
    isActive,
    mode,
    sessions,
    sessionGoal,
    progress,
    currentCycle,
    handleSettingsChange,
    toggleTimer,
    resetTimer,
    setSessionGoal
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full h-full min-h-0 items-stretch">
      {/* Large Timer Card */}
      <Card className="md:col-span-2 border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
        <CardHeader className="py-2.5 flex flex-row items-center justify-between border-b dark:border-gray-700/50 shrink-0">
          <CardTitle className="text-xs font-semibold text-gray-800 dark:text-white">
            {mode === 'work' ? 'Group Focus Session' : 'Break Time'}
            {sessionCourse && <span className="block text-[10px] font-normal text-gray-500 dark:text-gray-400 mt-0.5">Course: {sessionCourse}</span>}
            {currentCycle && <span className="block text-[9px] font-normal text-gray-400 dark:text-gray-555 mt-0.5">Cycle {currentCycle}</span>}
          </CardTitle>
          <SessionDetailsDialog
            title={sessionTitle}
            course={sessionCourse}
            hostName={hostName}
            startTime={startTime}
            sessionGoal={sessionGoal}
            workDuration={workDuration}
            breakDuration={breakDuration}
            isGroupSession={isGroupSession}
          />
        </CardHeader>
        <CardContent className="text-center p-3 flex-1 flex flex-col justify-center min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full py-4">
            <TimerDisplay
              timeLeft={timeLeft}
              isActive={isActive}
              mode={mode}
              progress={progress}
              onToggle={toggleTimer}
              onReset={resetTimer}
              onFinish={() => setReflectionOpen(true)}
              showFinishButton={isHost && (isActive || timeLeft < workDuration)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sidebar: Progress & Settings */}
      <div className="md:col-span-1 flex flex-col gap-3 h-full justify-between min-h-0">
        <div className="flex-1 min-h-0">
          <SessionProgress
            sessions={sessions}
            sessionGoal={sessionGoal}
            onSessionGoalChange={setSessionGoal}
          />
        </div>
        <div className="flex-1 min-h-0">
          <CurrentSettings
            workDuration={workDuration}
            breakDuration={breakDuration}
            longBreakDuration={longBreakDuration}
            onEdit={isHost ? () => setSettingsOpen(true) : undefined}
          />
        </div>
      </div>

      <SessionSettings
        workDuration={workDuration}
        breakDuration={breakDuration}
        longBreakDuration={longBreakDuration}
        onSettingsChange={handleSettingsChange}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
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
