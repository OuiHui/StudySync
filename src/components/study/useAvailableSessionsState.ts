import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailableSessions } from '@/hooks/useAvailableSessions';
import { StudySessionsService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { StudySessionCardData } from './SessionCard';

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const formatCardTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', '');
  return `${month} ${day}, ${timeStr}`;
};

const getDurationDisplay = (startStr: string, endStr: string, isLive: boolean) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const now = new Date();
  const diffMs = isLive ? (end.getTime() - now.getTime()) : (end.getTime() - start.getTime());
  
  if (diffMs <= 0) return isLive ? '0m left' : '0 minutes';
  
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / (60000 * 60));
  const diffDays = Math.round(diffMs / (60000 * 60 * 24));
  
  const suffix = isLive ? ' left' : '';
  
  if (diffDays >= 1) {
    return isLive ? `${diffDays}d${suffix}` : `${diffDays} days`;
  } else if (diffHours >= 1) {
    return isLive ? `${diffHours}h${suffix}` : `${diffHours} hours`;
  } else {
    return isLive ? `${diffMinutes}m${suffix}` : `${diffMinutes} minutes`;
  }
};

export function useAvailableSessionsState() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<StudySessionCardData | null>(null);
  const [confirmingSessionId, setConfirmingSessionId] = useState<string | null>(null);
  const { sessions, loading, error, loadSessions } = useAvailableSessions();

  useEffect(() => {
    if (confirmingSessionId) {
      const timer = setTimeout(() => {
        setConfirmingSessionId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmingSessionId]);

  const displaySessions: StudySessionCardData[] = sessions.map(session => {
    const start = new Date(session.scheduled_start);
    const end = new Date(session.scheduled_end);
    const isLive = (
      ['active', 'running', 'paused'].includes(session.status) ||
      (session.status === 'scheduled' && start <= new Date() && end >= new Date())
    );

    const timeRangeStr = `${formatCardTime(session.scheduled_start)} → ${formatCardTime(session.scheduled_end)}`;
    const hostProfile = session.profiles;
    const hostName = hostProfile?.display_name || session.session_participants?.find((p: any) => p.user_id === session.created_by)?.profiles?.display_name || 'Anonymous Host';
    const hostInitials = getInitials(hostName);
    const hostAvatarUrl = hostProfile?.avatar_url || null;

    return {
      ...session,
      id: session.id,
      groupName: session.study_groups?.name || session.title || 'Unknown Group',
      course: session.subject || session.study_groups?.subject || 'General Study',
      participants: session.participant_count || 0,
      participantList: session.session_participants || [],
      startTime: formatCardTime(session.scheduled_start),
      timeRange: timeRangeStr,
      duration: getDurationDisplay(session.scheduled_start, session.scheduled_end, isLive),
      type: isLive ? 'active' as const : 'planned' as const,
      description: session.description || '',
      title: session.title,
      hostName,
      hostInitials,
      hostAvatarUrl,
      isHost: session.created_by === user?.id
    };
  });

  const activeSessions = displaySessions.filter(s => s.type === 'active');
  const plannedSessions = displaySessions.filter(s => s.type === 'planned');

  useEffect(() => {
    if (selectedSession) {
      const updated = displaySessions.find(s => s.id === selectedSession.id);
      if (updated) {
        setSelectedSession(updated);
      }
    }
  }, [sessions]);

  const handleCancelSession = async (sessionId: string) => {
    try {
      await StudySessionsService.deleteSession(sessionId);
      setConfirmingSessionId(null);
      await loadSessions();
      toast({
        title: "Success",
        description: "Study session cancelled successfully!",
      });
    } catch (err: any) {
      console.error('Failed to cancel session:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to cancel study session",
        variant: "destructive",
      });
    }
  };

  const handleTogglePlanToAttend = async (sessionId: string) => {
    if (!user) return;
    const session = displaySessions.find(s => s.id === sessionId);
    if (!session) return;
    const myParticipant = session.participantList.find((p: any) => p.user_id === user.id);
    try {
      if (myParticipant && myParticipant.status !== 'invited') {
        await StudySessionsService.leaveSession(sessionId);
      } else {
        await StudySessionsService.planToAttendSession(sessionId);
      }
      await loadSessions();
    } catch (err) {
      console.error('Error toggling plan to attend:', err);
    }
  };

  return {
    user,
    loading,
    error,
    activeSessions,
    plannedSessions,
    selectedSession,
    setSelectedSession,
    confirmingSessionId,
    setConfirmingSessionId,
    handleCancelSession,
    handleTogglePlanToAttend,
    loadSessions
  };
}
