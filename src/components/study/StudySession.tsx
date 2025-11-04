
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionSettings } from './SessionSettings';
import { TimerDisplay } from './TimerDisplay';
import { SessionProgress } from './SessionProgress';
import { CurrentSettings } from './CurrentSettings';
import { StudyMaterial } from './StudyMaterial';
import { useTimer } from '@/hooks/useTimer';

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

  return (
    <div className="p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Study Session</h1>
          <p className="text-gray-600 dark:text-gray-300">Focus with the Pomodoro Technique</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl dark:text-white">
                  {mode === 'work' ? 'Work Session' : 'Break Time!'}
                </CardTitle>
                <SessionSettings
                  workDuration={workDuration}
                  breakDuration={breakDuration}
                  longBreakDuration={longBreakDuration}
                  onSettingsChange={handleSettingsChange}
                />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <TimerDisplay
                timeLeft={timeLeft}
                isActive={isActive}
                mode={mode}
                progress={progress}
                onToggle={toggleTimer}
                onReset={resetTimer}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <SessionProgress
              sessions={sessions}
              sessionGoal={sessionGoal}
              onSessionGoalChange={setSessionGoal}
            />
            <CurrentSettings
              workDuration={workDuration}
              breakDuration={breakDuration}
              longBreakDuration={longBreakDuration}
            />
          </div>
        </div>

        <StudyMaterial />
      </div>
    </div>
  );
};
