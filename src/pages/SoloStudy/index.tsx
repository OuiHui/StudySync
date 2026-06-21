import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StudySession } from '@/components/study/StudySession';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';

export default function SoloStudy() {
  const navigate = useNavigate();
  const { globalTimer, handleTimerUpdate } = useGlobalTimer();

  if (globalTimer.isGroupTimer && globalTimer.isActive) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Group Timer Active
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You cannot start a solo study session while a group timer is running.
        </p>
        <button
          onClick={() => navigate('/group-study-session')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
        >
          Return to Group Session
        </button>
      </div>
    );
  }

  return (
    <StudySession 
      onTimerUpdate={(isActive, timeLeft, initialTime, mode) => 
        handleTimerUpdate(isActive, timeLeft, initialTime, mode, false)
      }
      globalTimerState={globalTimer.isGroupTimer ? undefined : globalTimer}
    />
  );
}
