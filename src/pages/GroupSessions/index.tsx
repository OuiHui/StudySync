import React, { useEffect } from 'react';
import { GroupStudySession } from '@/components/study/GroupStudySession';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

export default function GroupSessions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id') || undefined;
  const { handleTimerUpdate, handleCancelTimer } = useGlobalTimer();
  const { setIsInGroupSession, setShowLeaveSessionDialog, setPendingNavigation } = useSession();
  const { currentTheme, handleThemeChange } = useOutletContext<any>();

  useEffect(() => {
    setIsInGroupSession(true);
    return () => {
      setIsInGroupSession(false);
    };
  }, [setIsInGroupSession]);

  const handleLeaveSession = () => {
    setPendingNavigation('/available-sessions');
    setShowLeaveSessionDialog(true);
  };

  return (
    <GroupStudySession 
      onLeaveSession={handleLeaveSession}
      onTimerUpdate={(isActive, timeLeft, initialTime, mode) => 
        handleTimerUpdate(isActive, timeLeft, initialTime, mode, true)
      }
      onThemeChange={handleThemeChange}
      currentTheme={currentTheme}
      sessionId={sessionId}
    />
  );
}
