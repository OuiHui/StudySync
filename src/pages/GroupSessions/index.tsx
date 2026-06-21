import React, { useEffect } from 'react';
import { GroupStudySession } from '@/components/study/GroupStudySession';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function GroupSessions() {
  const navigate = useNavigate();
  const { handleTimerUpdate, handleCancelTimer } = useGlobalTimer();
  const { setIsInGroupSession } = useSession();
  const { currentTheme, handleThemeChange } = useOutletContext<any>();

  useEffect(() => {
    setIsInGroupSession(true);
    return () => {
      setIsInGroupSession(false);
    };
  }, [setIsInGroupSession]);

  const handleLeaveSession = () => {
    setIsInGroupSession(false);
    handleCancelTimer();
    navigate('/available-sessions');
  };

  return (
    <GroupStudySession 
      onLeaveSession={handleLeaveSession}
      onTimerUpdate={(isActive, timeLeft, initialTime, mode) => 
        handleTimerUpdate(isActive, timeLeft, initialTime, mode, true)
      }
      onThemeChange={handleThemeChange}
      currentTheme={currentTheme}
    />
  );
}
