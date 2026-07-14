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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

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
    <div className={`p-6 overflow-y-auto min-h-screen bg-gradient-to-br ${gradientClass} dark:bg-none dark:bg-gray-900 flex flex-col justify-center items-center`}>
      <div className="max-w-3xl w-full space-y-6 animate-fade-in flex flex-col items-center">
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

        {/* Inline Details Panel */}
        <div className="w-full max-w-xl text-center space-y-2 select-none shrink-0 bg-white/40 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200/10 backdrop-blur-sm shadow-sm">
          <h1 className="text-xl font-extrabold text-gray-800 dark:text-white leading-tight">
            Solo Study Session
          </h1>
          
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Subject:</span>
              <span className="text-gray-700 dark:text-gray-200">Solo Study</span>
            </div>
            <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Start:</span>
              <span className="text-gray-700 dark:text-gray-200">{formatTimeStr(startTime)}</span>
            </div>
            <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Est. End:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{getEstimatedEndTime()}</span>
            </div>
          </div>
        </div>

        {/* Traditional Pomodoro Workspace Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Work Session Card */}
          <Card className="md:col-span-2 border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="pb-2 border-b dark:border-gray-700/50">
              <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-white">
                Work Session
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <TimerDisplay
                timeLeft={timeLeft}
                isActive={isActive}
                mode={mode}
                progress={progress}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onFinish={() => setReflectionOpen(true)}
                showFinishButton={isActive || timeLeft < workDuration}
              />
            </CardContent>
          </Card>

          {/* Sidebar Cards */}
          <div className="md:col-span-1 flex flex-col gap-4">
            {/* Today's Progress Card */}
            <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="pb-2 border-b dark:border-gray-700/50">
                <CardTitle className="text-sm font-semibold text-gray-800 dark:text-white">
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6 px-4 flex-1">
                <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                  {sessions}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">
                  Sessions Completed
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${Math.min((sessions / sessionGoal) * 100, 100)}%` }} 
                  />
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300">
                  <span>Goal: {sessionGoal} sessions</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Pencil size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timer Configuration Card */}
            <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
              <CardHeader className="pb-2 border-b dark:border-gray-700/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-800 dark:text-white">
                  Timer Configuration
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Pencil size={12} />
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Work Duration</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{workDuration / 60} min</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Break Duration</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{breakDuration / 60} min</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Long Break</span>
                  <span className="text-gray-800 dark:text-white font-semibold">{longBreakDuration / 60} min</span>
                </div>
              </CardContent>
            </Card>
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
