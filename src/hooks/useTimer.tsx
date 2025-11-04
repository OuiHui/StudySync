
import { useState, useEffect, useRef } from 'react';

interface UseTimerProps {
  onTimerUpdate?: (isActive: boolean, timeLeft: number, initialTime?: number, mode?: 'work' | 'break') => void;
  globalTimerState?: {
    isActive: boolean;
    timeLeft: number;
    initialTime: number;
    mode: 'work' | 'break';
  };
}

export const useTimer = ({ onTimerUpdate, globalTimerState }: UseTimerProps) => {
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
        onTimerUpdate(isActive, timeLeft, workDuration, mode);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isActive, timeLeft, mode, workDuration, onTimerUpdate]);

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
      } else {
        setMode('work');
        setTimeLeft(workDuration);
      }
    }
  }, [timeLeft, isActive, mode, workDuration, breakDuration, longBreakDuration, sessions]);

  const handleSettingsChange = (settings: { workDuration: number; breakDuration: number; longBreakDuration: number }) => {
    setWorkDuration(settings.workDuration);
    setBreakDuration(settings.breakDuration);
    setLongBreakDuration(settings.longBreakDuration);
    
    if (!isActive) {
      const newTimeLeft = mode === 'work' ? settings.workDuration : settings.breakDuration;
      setTimeLeft(newTimeLeft);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    const newTimeLeft = mode === 'work' ? workDuration : breakDuration;
    setTimeLeft(newTimeLeft);
    
    // Reset to initial state - this will hide the global timer
    if (onTimerUpdate) {
      setTimeout(() => {
        onTimerUpdate(false, newTimeLeft, workDuration, mode);
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
    handleSettingsChange,
    toggleTimer,
    resetTimer,
    setSessionGoal
  };
};
