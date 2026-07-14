
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
  sessionData?: any;
  timerSyncPayload?: {
    isActive: boolean;
    timeLeft: number;
    mode: 'work' | 'break';
    currentCycle: number;
    pauseLogs: { paused_at: string; resumed_at: string | null }[];
    hostLocalTimestamp: string;
    workDurationSetting?: number;
    breakDurationSetting?: number;
    longBreakDurationSetting?: number;
    sessionGoal?: number;
  } | null;
}

export const useTimer = ({ onTimerUpdate, globalTimerState, sessionId, isHost = true, sessionData, timerSyncPayload }: UseTimerProps) => {
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

  // Sync non-host participants with the database timer state from host
  useEffect(() => {
    if (isHost || !sessionData) return;

    const dbIsActive = sessionData.status === 'running' || sessionData.status === 'active';
    setIsActive(dbIsActive);

    if (sessionData.timer_mode) {
      setMode(sessionData.timer_mode as 'work' | 'break');
    }
    if (sessionData.current_cycle) {
      setCurrentCycle(sessionData.current_cycle);
      setSessions(sessionData.current_cycle - 1);
    }

    const cycleDur = sessionData.timer_mode === 'break'
      ? (sessionData.current_cycle % 4 === 0 ? longBreakDuration : breakDuration)
      : workDuration;

    if (!sessionData.actual_start) {
      setTimeLeft(cycleDur);
      setIsActive(false);
      return;
    }

    let calculationEndMs = Date.now();
    if (!dbIsActive) {
      const logs = sessionData.pause_logs || [];
      if (logs.length > 0 && logs[logs.length - 1].paused_at) {
        calculationEndMs = new Date(logs[logs.length - 1].paused_at).getTime();
      }
    }

    const startMs = new Date(sessionData.actual_start).getTime();
    let totalPausedMs = 0;
    const logs = sessionData.pause_logs || [];
    logs.forEach((log: any) => {
      if (log.paused_at && log.resumed_at) {
        const pausedAt = new Date(log.paused_at).getTime();
        const resumedAt = new Date(log.resumed_at).getTime();
        if (resumedAt >= pausedAt) {
          totalPausedMs += (resumedAt - pausedAt);
        }
      }
    });

    const totalElapsedMs = (calculationEndMs - startMs) - totalPausedMs;
    const elapsedSeconds = Math.max(0, Math.floor(totalElapsedMs / 1000));
    const calculatedTimeLeft = Math.max(0, cycleDur - elapsedSeconds);

    if (Math.abs(timeLeft - calculatedTimeLeft) > 2) {
      setTimeLeft(calculatedTimeLeft);
    }
  }, [sessionData, isHost, workDuration, breakDuration, longBreakDuration, timeLeft]);

  // Sync non-host participants with real-time broadcast ticks
  useEffect(() => {
    if (isHost || !timerSyncPayload) return;

    const clientNow = Date.now();
    const hostTimestamp = new Date(timerSyncPayload.hostLocalTimestamp).getTime();
    const latency = Math.max(0, (clientNow - hostTimestamp) / 2);
    
    const correctedTime = timerSyncPayload.isActive
      ? Math.max(0, timerSyncPayload.timeLeft - Math.round(latency / 1000))
      : timerSyncPayload.timeLeft;

    setTimeLeft(correctedTime);
    setIsActive(timerSyncPayload.isActive);
    setMode(timerSyncPayload.mode);
    
    if (timerSyncPayload.currentCycle !== undefined) {
      setCurrentCycle(timerSyncPayload.currentCycle);
      setSessions(timerSyncPayload.currentCycle - 1);
    }
    if (timerSyncPayload.pauseLogs !== undefined) {
      setPauseLogs(timerSyncPayload.pauseLogs);
    }
    if (timerSyncPayload.workDurationSetting !== undefined) {
      setWorkDuration(timerSyncPayload.workDurationSetting);
    }
    if (timerSyncPayload.breakDurationSetting !== undefined) {
      setBreakDuration(timerSyncPayload.breakDurationSetting);
    }
    if (timerSyncPayload.longBreakDurationSetting !== undefined) {
      setLongBreakDuration(timerSyncPayload.longBreakDurationSetting);
    }
    if (timerSyncPayload.sessionGoal !== undefined) {
      setSessionGoal(timerSyncPayload.sessionGoal);
    }
  }, [timerSyncPayload, isHost]);

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

  const onTimerUpdateRef = useRef(onTimerUpdate);
  useEffect(() => {
    onTimerUpdateRef.current = onTimerUpdate;
  }, [onTimerUpdate]);

  // Report timer updates to parent
  useEffect(() => {
    if (onTimerUpdateRef.current) {
      onTimerUpdateRef.current(isActive, timeLeft, workDuration, mode, currentCycle, pauseLogs);
    }
  }, [isActive, timeLeft, mode, workDuration, currentCycle, pauseLogs]);


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

    if (isHost && sessionId) {
      StudySessionsMutations.updateSession(sessionId, {
        target_duration: settings.workDuration
      }).catch(err => console.error("Failed to update target_duration in DB:", err));
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
