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
      const savedSessionId = localStorage.getItem('active_group_session_id');
      if (savedSessionId) {
        navigate(`/group-study-session?id=${savedSessionId}`);
      } else {
        navigate('/group-study-session');
      }
    }
  }, [isInGroupSession, navigate]);

  const handleJoinSession = (sessionId: string) => {
    localStorage.setItem('active_group_session_id', sessionId);
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
