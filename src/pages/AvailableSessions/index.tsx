import React, { useEffect } from 'react';
import { AvailableSessionsList } from '@/components/study/AvailableSessionsList';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';

export default function AvailableSessions() {
  const navigate = useNavigate();
  const { isInGroupSession, setIsInGroupSession, setShowLeaveSessionDialog, setPendingNavigation } = useSession();
  const { globalTimer } = useGlobalTimer();

  useEffect(() => {
    if (isInGroupSession) {
      navigate('/group-study-session');
    }
  }, [isInGroupSession, navigate]);

  const handleJoinSession = (sessionId: string) => {
    if (globalTimer.isActive && !globalTimer.isGroupTimer) {
      setPendingNavigation(`/group-study-session?id=${sessionId}`);
      setShowLeaveSessionDialog(true);
      return;
    }
    
    setIsInGroupSession(true);
    navigate(`/group-study-session?id=${sessionId}`);
  };

  return <AvailableSessionsList onJoinSession={handleJoinSession} />;
}
