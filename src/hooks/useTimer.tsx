
import { useState, useEffect, useRef } from 'react';
import { StudySessionsMutations } from '@/services/studySessions/mutations';

interface UseTimerProps {
  onTimerUpdate?: (
    isActive: boolean,
    timeLeft: number,
    initialTime?: number,
    mode?: 'work' | 'break',
    currentCycle?: number,
    pauseLogs?: { paused_at: string; resumed_at: string | null }[]
  ) => void;
  globalTimerState?: {
    isActive: boolean;
    timeLeft: number;
    initialTime: number;
    mode: 'work' | 'break';
    currentCycle: number;
    pauseLogs: { paused_at: string; resumed_at: string | null }[];
  };
  sessionId?: string;
  isHost?: boolean;
}

export const useTimer = ({ onTimerUpdate, globalTimerState, sessionId, isHost = true }: UseTimerProps) => {
  const initialWorkDuration = 25 * 60;
  const [workDuration, setWorkDuration] = useState(initialWorkDuration);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [longBreakDuration, setLongBreakDuration] = useState(15 * 60);
  const [timeLeft, setTimeLeft] = useState(initialWorkDuration);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [sessions, setSessions] = useState(0);
  const [sessionGoal, setSessionGoal] = useState(8);
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [pauseLogs, setPauseLogs] = useState<{ paused_at: string; resumed_at: string | null }[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  // Initialize from global timer state only once for group sessions
  useEffect(() => {
    if (globalTimerState && !hasInitialized.current) {
      // Use global state if it exists, regardless of active state to preserve paused timers
      if (globalTimerState.timeLeft > 0 || globalTimerState.isActive) {
        setTimeLeft(globalTimerState.timeLeft);
        setIsActive(globalTimerState.isActive);
        setMode(globalTimerState.mode);
        if (globalTimerState.currentCycle !== undefined) {
          setCurrentCycle(globalTimerState.currentCycle);
        }
        if (globalTimerState.pauseLogs !== undefined) {
          setPauseLogs(globalTimerState.pauseLogs);
        }
      }
      hasInitialized.current = true;
    }
    // Reset initialization flag when globalTimerState changes to allow re-sync
    if (!globalTimerState) {
      hasInitialized.current = false;
    }
  }, [globalTimerState]);

  // Main timer interval
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeLeft]);

  // Report timer updates to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onTimerUpdate) {
        onTimerUpdate(isActive, timeLeft, workDuration, mode, currentCycle, pauseLogs);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isActive, timeLeft, mode, workDuration, currentCycle, pauseLogs, onTimerUpdate]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false);
      
      setShowCompletionEffect(true);
      setTimeout(() => setShowCompletionEffect(false), 2000);
      
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBtn20+3ahCsFJH3K8OKQR...');
        audio.play().catch(() => {});
      } catch (error) {}
      
      if (mode === 'work') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        setMode('break');
        const nextBreakDuration = newSessions % 4 === 0 ? longBreakDuration : breakDuration;
        setTimeLeft(nextBreakDuration);
        
        const nextCycle = currentCycle + 1;
        setCurrentCycle(nextCycle);
        if (sessionId) {
          StudySessionsMutations.updateSession(sessionId, {
            current_cycle: nextCycle,
            timer_mode: 'break'
          }).catch(console.error);
        }
      } else {
        setMode('work');
        setTimeLeft(workDuration);
        if (sessionId) {
          StudySessionsMutations.updateSession(sessionId, {
            timer_mode: 'work'
          }).catch(console.error);
        }
      }
    }
  }, [timeLeft, isActive, mode, workDuration, breakDuration, longBreakDuration, sessions, currentCycle, sessionId]);

  const handleSettingsChange = (settings: { workDuration: number; breakDuration: number; longBreakDuration: number }) => {
    setWorkDuration(settings.workDuration);
    setBreakDuration(settings.breakDuration);
    setLongBreakDuration(settings.longBreakDuration);
    
    if (!isActive) {
      const newTimeLeft = mode === 'work' ? settings.workDuration : settings.breakDuration;
      setTimeLeft(newTimeLeft);
    }
  };

  const toggleTimer = async () => {
    if (!isHost && sessionId) return;

    const nextActive = !isActive;
    setIsActive(nextActive);

    const nowIso = new Date().toISOString();
    let updatedLogs = [...pauseLogs];

    if (!nextActive) {
      updatedLogs.push({ paused_at: nowIso, resumed_at: null });
      setPauseLogs(updatedLogs);
      if (sessionId) {
        try {
          await StudySessionsMutations.pauseSession(sessionId);
        } catch (err) {
          console.error('Error pausing session in DB:', err);
        }
      }
    } else {
      if (updatedLogs.length > 0 && updatedLogs[updatedLogs.length - 1].resumed_at === null) {
        updatedLogs[updatedLogs.length - 1].resumed_at = nowIso;
      }
      setPauseLogs(updatedLogs);
      if (sessionId) {
        try {
          await StudySessionsMutations.resumeSession(sessionId);
        } catch (err) {
          console.error('Error resuming session in DB:', err);
        }
      }
    }
  };
  
  const resetTimer = async () => {
    if (!isHost && sessionId) return;

    setIsActive(false);
    const newTimeLeft = mode === 'work' ? workDuration : breakDuration;
    setTimeLeft(newTimeLeft);
    setPauseLogs([]);
    setCurrentCycle(1);

    if (sessionId) {
      try {
        await StudySessionsMutations.updateSessionStatus(sessionId, 'cancelled');
      } catch (err) {
        console.error('Error cancelling session in DB:', err);
      }
    }
    
    if (onTimerUpdate) {
      setTimeout(() => {
        onTimerUpdate(false, newTimeLeft, workDuration, mode, 1, []);
      }, 0);
    }
  };

  const progress = mode === 'work' 
    ? ((workDuration - timeLeft) / workDuration) * 100
    : ((breakDuration - timeLeft) / breakDuration) * 100;

  return {
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
    currentCycle,
    pauseLogs,
    handleSettingsChange,
    toggleTimer,
    resetTimer,
    setSessionGoal
  };
};
