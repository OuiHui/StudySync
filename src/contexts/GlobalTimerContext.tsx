import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TimerMode = 'work' | 'break';

export interface GlobalTimerState {
  isActive: boolean;
  timeLeft: number;
  initialTime: number;
  mode: TimerMode;
  isGroupTimer: boolean;
  formatTime: (seconds: number) => string;
  currentCycle: number;
  pauseLogs: { paused_at: string; resumed_at: string | null }[];
}

export interface GlobalTimerContextType {
  globalTimer: GlobalTimerState;
  setGlobalTimer: React.Dispatch<React.SetStateAction<GlobalTimerState>>;
  handleTimerUpdate: (
    isActive: boolean,
    timeLeft: number,
    initialTime?: number,
    mode?: TimerMode,
    isGroupTimer?: boolean,
    currentCycle?: number,
    pauseLogs?: { paused_at: string; resumed_at: string | null }[]
  ) => void;
  handleGlobalTimerToggle: () => void;
  handleCancelTimer: () => void;
}

const GlobalTimerContext = createContext<GlobalTimerContextType | undefined>(undefined);

export const GlobalTimerProvider = ({ children }: { children: ReactNode }) => {
  const [globalTimer, setGlobalTimer] = useState<GlobalTimerState>({
    isActive: false,
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    mode: 'work',
    isGroupTimer: false,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    currentCycle: 1,
    pauseLogs: []
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (globalTimer.isActive && globalTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setGlobalTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (globalTimer.timeLeft === 0 && globalTimer.isActive) {
      setGlobalTimer(prev => ({ ...prev, isActive: false }));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [globalTimer.isActive, globalTimer.timeLeft]);

  useEffect(() => {
    (window as any).globalTimerState = globalTimer;
  }, [globalTimer]);

  const handleTimerUpdate = (
    isActive: boolean,
    timeLeft: number,
    initialTime?: number,
    mode?: TimerMode,
    isGroupTimer: boolean = false,
    currentCycle?: number,
    pauseLogs?: { paused_at: string; resumed_at: string | null }[]
  ) => {
    const shouldUpdate = globalTimer.isGroupTimer === isGroupTimer;
    if (shouldUpdate) {
      setGlobalTimer(prev => ({
        ...prev,
        isActive,
        timeLeft,
        initialTime: initialTime !== undefined ? initialTime : prev.initialTime,
        mode: mode !== undefined ? mode : prev.mode,
        isGroupTimer,
        currentCycle: currentCycle !== undefined ? currentCycle : prev.currentCycle,
        pauseLogs: pauseLogs !== undefined ? pauseLogs : prev.pauseLogs
      }));
    }
  };

  const handleGlobalTimerToggle = () => {
    setGlobalTimer(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleCancelTimer = () => {
    setGlobalTimer(prev => ({
      ...prev,
      isActive: false,
      timeLeft: 0,
      initialTime: 25 * 60,
      isGroupTimer: false,
      currentCycle: 1,
      pauseLogs: []
    }));
  };

  return (
    <GlobalTimerContext.Provider value={{ globalTimer, setGlobalTimer, handleTimerUpdate, handleGlobalTimerToggle, handleCancelTimer }}>
      {children}
    </GlobalTimerContext.Provider>
  );
};

export const useGlobalTimer = () => {
  const context = useContext(GlobalTimerContext);
  if (context === undefined) {
    throw new Error('useGlobalTimer must be used within a GlobalTimerProvider');
  }
  return context;
};
