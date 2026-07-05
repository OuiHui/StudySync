import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StudySessionsService } from '@/services/database';
import { ReflectionDialog } from './ReflectionDialog';
import { SessionSettings } from './SessionSettings';
import { TimerDisplay } from './TimerDisplay';
import { StudyMaterial } from './StudyMaterial';
import { StudyGoals } from './StudyGoals';
import { SessionDetailsDialog } from './SessionDetailsDialog';
import { Badge } from '@/components/ui/badge';
import { useTimer } from '@/hooks/useTimer';
import { useProfileData } from '@/hooks/useProfileData';

interface StudySessionProps {
  onTimerUpdate?: (isActive: boolean, timeLeft: number, initialTime?: number, mode?: 'work' | 'break') => void;
  globalTimerState?: {
    isActive: boolean;
    timeLeft: number;
    initialTime: number;
    mode: 'work' | 'break';
  };
}

export const StudySession = ({ onTimerUpdate, globalTimerState }: StudySessionProps) => {
  const {
    workDuration,
    breakDuration,
    longBreakDuration,
    timeLeft,
    isActive,
    mode,
    sessions,
    sessionGoal,
    showCompletionEffect,
    progress,
    handleSettingsChange,
    toggleTimer,
    resetTimer,
    setSessionGoal
  } = useTimer({ onTimerUpdate, globalTimerState });

  const { user } = useAuth();
  const { toast } = useToast();
  const { userStats } = useProfileData();
  const { currentTheme } = useOutletContext<any>() || {};

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);

  const formatTimeStr = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const getEstimatedEndTime = () => {
    const start = startTime ? new Date(startTime) : new Date();
    const totalSeconds = sessionGoal * (workDuration + breakDuration);
    const end = new Date(start.getTime() + totalSeconds * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Local storage study goals for Solo session
  const [goals, setGoals] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  useEffect(() => {
    setStartTime(new Date().toISOString());
    const saved = localStorage.getItem('solo_study_goals');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    } else {
      setGoals([
        { id: '1', title: 'Review lecture notes', completed: false },
        { id: '2', title: 'Solve practice problems', completed: false }
      ]);
    }
  }, []);

  const saveGoals = (newGoals: typeof goals) => {
    setGoals(newGoals);
    localStorage.setItem('solo_study_goals', JSON.stringify(newGoals));
  };

  const handleAddGoal = async (title: string) => {
    const newGoal = {
      id: Math.random().toString(36).substring(2),
      title,
      completed: false
    };
    saveGoals([...goals, newGoal]);
  };

  const handleToggleGoal = async (goalId: string, completed: boolean) => {
    saveGoals(goals.map(g => g.id === goalId ? { ...g, completed } : g));
  };

  const handleDeleteGoal = async (goalId: string) => {
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  const handleReflectionSubmit = async (rating: number, notes: string) => {
    setSavingReflection(true);
    try {
      const minutesStudied = Math.round(sessions * (workDuration / 60));
      await StudySessionsService.createSession({
        title: "Solo Study Session",
        scheduled_start: startTime || new Date().toISOString(),
        scheduled_end: new Date().toISOString(),
        subject: "Solo Study",
        target_duration: minutesStudied
      });
      
      // Get the latest created session by the user and update reflections/minutes
      const { data: latestSession } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('created_by', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (latestSession) {
        await supabase
          .from('study_sessions')
          .update({
            reflection_rating: rating,
            reflection_notes: notes,
            status: 'finished',
            actual_start: startTime,
            actual_end: new Date().toISOString(),
            minutes_studied: minutesStudied
          } as any)
          .eq('id', latestSession.id);
      }
      
      toast({
        title: "Session saved",
        description: `Successfully logged ${minutesStudied} minutes of study!`
      });
      resetTimer();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error saving session",
        variant: "destructive"
      });
    } finally {
      setSavingReflection(false);
    }
  };

  const gradientClass = currentTheme?.gradient || 'from-blue-50 to-indigo-100';

  return (
    <div className={`p-6 overflow-y-auto min-h-screen bg-gradient-to-br ${gradientClass} dark:bg-none dark:bg-gray-905 flex flex-col justify-center items-center`}>
      <div className="max-w-3xl w-full space-y-6 animate-fade-in flex flex-col items-center">
        {/* Header/Subtitle */}
        <div className="text-center shrink-0">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-555">
            focus with the pomodoro technique
          </p>
        </div>



        {showCompletionEffect && (
          <div className="fixed inset-0 bg-green-500/20 dark:bg-green-400/20 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {mode === 'work' ? 'Work Session Complete!' : 'Break Time Over!'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Great job!</p>
            </div>
          </div>
        )}

        {/* Consolidated Timer & Pills Display */}
        <div className="w-full flex flex-col items-center">
          <TimerDisplay
            timeLeft={timeLeft}
            isActive={isActive}
            mode={mode}
            progress={progress}
            onToggle={toggleTimer}
            onReset={resetTimer}
            onFinish={() => setReflectionOpen(true)}
            showFinishButton={isActive || timeLeft < workDuration}
            onSettingsClick={() => setSettingsOpen(true)}
          />

          {/* Metric Pills Row */}
          <div className="flex justify-center space-x-2 mt-4 shrink-0">
            <Badge variant="secondary" className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 text-gray-700 dark:text-gray-300 rounded-full font-medium">
              {sessions} / {sessionGoal} sessions
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 text-gray-700 dark:text-gray-300 rounded-full font-medium">
              {Math.round(sessions * (workDuration / 60))} minutes studied
            </Badge>
          </div>
        </div>

        {/* Lower Cards Area: Goals and Materials 50/50 side-by-side layout */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          <div className="h-full min-h-0">
            <StudyGoals
              goals={goals}
              loading={false}
              isHost={true}
              onAddGoal={handleAddGoal}
              onToggleGoal={handleToggleGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          </div>
          <div className="h-full min-h-0">
            <StudyMaterial />
          </div>
        </div>
      </div>

      <SessionSettings
        workDuration={workDuration}
        breakDuration={breakDuration}
        longBreakDuration={longBreakDuration}
        sessionGoal={sessionGoal}
        onSettingsChange={handleSettingsChange}
        onSessionGoalChange={setSessionGoal}
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
