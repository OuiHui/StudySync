import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StudySessionsService, NotesService } from '@/services/database';
import { useTimer } from '@/hooks/useTimer';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';

interface Participant {
  user_id: string;
  role: string;
  status: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Goal {
  id: string;
  title: string;
  completed: boolean;
}

interface NoteItem {
  id: string;
  title: string;
  content: string | null;
  subject?: string | null;
  created_at: string;
  created_by: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useGroupStudySessionData = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setIsInGroupSession, setSessionStarted } = useSession();
  const { toast } = useToast();

  const urlSessionId = searchParams.get('id');
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || localStorage.getItem('active_group_session_id');
  });

  const [sessionData, setSessionData] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [timerSyncPayload, setTimerSyncPayload] = useState<any>(null);

  const [loading, setLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    const savedId = urlId || localStorage.getItem('active_group_session_id');
    const hasCache = localStorage.getItem('cached_session_title');
    return !(savedId && hasCache);
  });
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const [sessionSubject, setSessionSubject] = useState<string | null>(() => 
    localStorage.getItem('cached_session_subject')
  );
  const [sessionTitle, setSessionTitle] = useState<string>(() => 
    localStorage.getItem('cached_session_title') || 'Group Study Session'
  );
  const [hostName, setHostName] = useState<string>(() => 
    localStorage.getItem('cached_session_host') || ''
  );
  const [startTime, setStartTime] = useState<string | null>(() => 
    localStorage.getItem('cached_session_start')
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [savingReflection, setSavingReflection] = useState(false);

  const channelRef = useRef<any>(null);
  const isLeavingSessionRef = useRef(false);
  const userRef = useRef(user);
  const initCompletedRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep userRef in sync and retry init if user became available after sessionId was set
  useEffect(() => {
    const wasNull = !userRef.current;
    userRef.current = user;
    if (wasNull && user && sessionId && !initCompletedRef.current) {
      // Auth resolved after sessionId was already set — run init now
      loadSessionDetails(sessionId);
      loadParticipants(sessionId);
      loadGoals(sessionId);
      loadNotes(sessionId).then(() => {
        if (!channelRef.current) setupRealTimeSync(sessionId);
        setLoading(false);
        initCompletedRef.current = true;
      });

      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => loadParticipants(sessionId), 8000);
      }
    }
  }, [user]);

  // Sync state between URL and localStorage
  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId);
      localStorage.setItem('active_group_session_id', urlSessionId);
    } else {
      const savedId = localStorage.getItem('active_group_session_id');
      if (savedId) {
        setSessionId(savedId);
        navigate(`/group-study-session?id=${savedId}`, { replace: true });
      } else {
        setLoading(false);
      }
    }
  }, [urlSessionId, navigate]);

  const loadSessionDetails = async (id: string) => {
    try {
      const data = await StudySessionsService.getSession(id);
      if (!data) throw new Error("Session not found");

      const isEnded = ['completed', 'finished', 'cancelled'].includes(data.status?.toLowerCase() || '') ||
                      (data.status?.toLowerCase() === 'scheduled' && data.scheduled_end && new Date(data.scheduled_end) < new Date());
      if (isEnded) {
        throw new Error("This study session has ended");
      }
      
      setSessionData(data);
      const currentUser = userRef.current;
      if (currentUser) {
        setIsHost(data.created_by === currentUser.id);
      }
      if (data.subject) {
        setSessionSubject(data.subject);
        localStorage.setItem('cached_session_subject', data.subject);
      }
      if (data.title) {
        setSessionTitle(data.title);
        localStorage.setItem('cached_session_title', data.title);
      }
      if (data.actual_start) {
        setStartTime(data.actual_start);
        localStorage.setItem('cached_session_start', data.actual_start);
      }

      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', data.created_by)
          .single();
        if (profile?.display_name) {
          setHostName(profile.display_name);
          localStorage.setItem('cached_session_host', profile.display_name);
        }
      }

      const started = !!data.actual_start || data.status !== 'scheduled';
      setSessionStarted(started);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error loading session",
        description: "Could not fetch details for this study session.",
        variant: "destructive"
      });
      localStorage.removeItem('active_group_session_id');
      setIsInGroupSession(false);
      navigate('/available-sessions');
    }
  };

  const loadParticipants = async (id: string) => {
    try {
      const data = await StudySessionsService.getParticipants(id);
      setParticipants(data || []);
      const currentUser = userRef.current;
      const myParticipant = data?.find((p: any) => p.user_id === currentUser?.id);
      if (currentUser && data && (!myParticipant || myParticipant.status !== 'active')) {
        await StudySessionsService.joinSession(id, currentUser.id, 'participant');
        const refreshed = await StudySessionsService.getParticipants(id);
        setParticipants(refreshed || []);
      }
    } catch (err) {
      console.error("Error loading participants:", err);
    }
  };

  const loadGoals = async (id: string) => {
    try {
      const data = await StudySessionsService.getGoals(id);
      setGoals(data || []);
    } catch (err) {
      console.error("Error loading goals:", err);
    }
  };

  const loadNotes = async (id: string) => {
    try {
      const data = await NotesService.getSessionNotes(id);
      setNotes(data || []);
    } catch (err) {
      console.error("Error loading notes:", err);
    }
  };

  const setupRealTimeSync = (id: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room:${id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${id}` },
        (payload) => {
          console.log('[Realtime] session_participants change received:', payload.eventType);
          loadParticipants(id);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_goals', filter: `session_id=eq.${id}` },
        () => loadGoals(id)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `session_id=eq.${id}` },
        () => loadNotes(id)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions', filter: `id=eq.${id}` },
        () => loadSessionDetails(id)
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.values(state).flatMap((pList: any) => pList.map((p: any) => p.user_id));
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const state = channel.presenceState();
        const userIds = Object.values(state).flatMap((pList: any) => pList.map((p: any) => p.user_id));
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const state = channel.presenceState();
        const userIds = Object.values(state).flatMap((pList: any) => pList.map((p: any) => p.user_id));
        setOnlineUsers(userIds);
      })
      .on('broadcast', { event: 'timer_sync' }, ({ payload }) => {
        if (isHost) return;
        setTimerSyncPayload(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Channel status:', status);
        if (status === 'SUBSCRIBED') {
          const currentUser = userRef.current;
          if (!currentUser) return;
          setTimeout(async () => {
            try {
              await channel.track({
                user_id: currentUser.id,
                online_at: new Date().toISOString()
              });
            } catch (err) {
              console.error("Error tracking presence:", err);
            }
          }, 0);
        }
      });

    channelRef.current = channel;
  };

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    initCompletedRef.current = false;

    const init = async () => {
      // If user isn't available yet, the user-watcher effect above will retry
      if (!userRef.current) return;

      const savedId = localStorage.getItem('active_group_session_id');
      const hasCache = localStorage.getItem('cached_session_title');
      if (!(savedId && hasCache)) {
        setLoading(true);
      }
      await loadSessionDetails(sessionId);
      await loadParticipants(sessionId);
      await loadGoals(sessionId);
      await loadNotes(sessionId);

      if (cancelled) return;

      setupRealTimeSync(sessionId);
      setLoading(false);
      initCompletedRef.current = true;
    };

    init();

    pollIntervalRef.current = setInterval(() => {
      loadParticipants(sessionId);
    }, 8000);

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId]);


  // Set user's participant status back to 'accepted' when they leave the session page (unmount)
  useEffect(() => {
    return () => {
      if (sessionId && user && !isLeavingSessionRef.current) {
        StudySessionsService.updateParticipantStatus(sessionId, user.id, 'accepted')
          .catch(err => console.error("Error setting participant status to accepted on unmount:", err));
      }
    };
  }, [sessionId, user]);

  // Resync database data when user refocuses the page
  useEffect(() => {
    if (!sessionId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSessionDetails(sessionId);
        loadParticipants(sessionId);
        loadGoals(sessionId);
        loadNotes(sessionId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId]);

  const onLeaveSession = async () => {
    if (!sessionId || !user) return;
    try {
      isLeavingSessionRef.current = true;
      const minutesStudied = Math.round(sessions * (workDuration / 60));
      // Note: We don't update session_participants.minutes_studied here because
      // the participant row is deleted immediately after in leaveSession().
      await StudySessionsService.leaveSession(sessionId, user.id);
      localStorage.removeItem('active_group_session_id');
      setIsInGroupSession(false);
      toast({
        title: "Left session",
        description: `Successfully left and logged ${minutesStudied} minutes of study!`
      });
      navigate('/available-sessions');
    } catch (err) {
      console.error("Failed to leave session:", err);
    }
  };

  const { handleTimerUpdate } = useGlobalTimer();

  // Timer Tick sync callback
  const onTimerUpdate = async (
    isActive: boolean,
    timeLeft: number,
    initialTime?: number,
    mode?: 'work' | 'break',
    currentCycle?: number,
    pauseLogs?: { paused_at: string; resumed_at: string | null }[]
  ) => {
    // Sync to global timer state in memory (so the header/sidebar indicators are updated)
    handleTimerUpdate(isActive, timeLeft, initialTime, mode, true, currentCycle, pauseLogs);
  };

  const {
    workDuration,
    breakDuration,
    longBreakDuration,
    timeLeft,
    isActive,
    mode,
    sessions,
    sessionGoal,
    progress,
    currentCycle,
    handleSettingsChange,
    toggleTimer,
    resetTimer,
    setSessionGoal,
    pauseLogs
  } = useTimer({
    onTimerUpdate,
    globalTimerState: (window as any).globalTimerState,
    sessionId: sessionId || undefined,
    isHost,
    sessionData,
    timerSyncPayload
  });

  const lastBroadcastRef = useRef<number>(0);
  const prevIsActiveRef = useRef<boolean | null>(null);
  const prevModeRef = useRef<'work' | 'break' | null>(null);
  const prevSettingsRef = useRef<string>('');
  const prevOnlineCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isHost || !sessionId || !channelRef.current) return;

    const now = Date.now();
    const settingsStr = `${workDuration}-${breakDuration}-${longBreakDuration}-${sessionGoal}`;
    const stateChanged = 
      prevIsActiveRef.current !== isActive || 
      prevModeRef.current !== mode ||
      prevSettingsRef.current !== settingsStr;

    const onlineCountChanged = prevOnlineCountRef.current < onlineUsers.length;
    prevOnlineCountRef.current = onlineUsers.length;

    const shouldBroadcast = 
      stateChanged ||
      onlineCountChanged ||
      now - lastBroadcastRef.current >= 3000 ||
      timeLeft === 0;

    if (shouldBroadcast) {
      prevIsActiveRef.current = isActive;
      prevModeRef.current = mode;
      prevSettingsRef.current = settingsStr;
      lastBroadcastRef.current = now;

      channelRef.current.send({
        type: 'broadcast',
        event: 'timer_sync',
        payload: {
          isActive,
          timeLeft,
          mode,
          currentCycle,
          pauseLogs,
          hostLocalTimestamp: new Date().toISOString(),
          workDurationSetting: workDuration,
          breakDurationSetting: breakDuration,
          longBreakDurationSetting: longBreakDuration,
          sessionGoal: sessionGoal
        }
      }).catch((err: any) => console.error("Failed to broadcast timer sync:", err));
    }
  }, [
    isHost,
    sessionId,
    isActive,
    timeLeft,
    mode,
    currentCycle,
    pauseLogs,
    workDuration,
    breakDuration,
    longBreakDuration,
    sessionGoal,
    onlineUsers.length
  ]);

  const handleToggleStatus = async () => {
    if (!sessionId || !user) return;
    const currentParticipant = participants.find(p => p.user_id === user.id);
    if (!currentParticipant) return;

    const nextStatus = currentParticipant.status === 'active' ? 'away' : 'active';
    try {
      await StudySessionsService.updateParticipantStatus(sessionId, user.id, nextStatus);
      toast({
        title: `Status changed`,
        description: `Your status is now ${nextStatus}.`
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleKickParticipant = async (targetUserId: string) => {
    if (!sessionId || !isHost) return;
    try {
      await StudySessionsService.removeParticipant(sessionId, targetUserId);
      await loadParticipants(sessionId);
      toast({
        title: "Participant removed",
        description: "Successfully removed the participant from the session."
      });
    } catch (err) {
      console.error("Failed to kick participant:", err);
    }
  };

  const handleAddGoal = async (title: string) => {
    if (!sessionId) return;
    try {
      setGoalsLoading(true);
      await StudySessionsService.createGoal({ session_id: sessionId, title });
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleToggleGoal = async (goalId: string, completed: boolean) => {
    try {
      await StudySessionsService.updateGoal(goalId, { completed });
    } catch (err) {
      console.error("Failed to toggle goal:", err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await StudySessionsService.deleteGoal(goalId);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleAddNote = async (title: string, content: string, subject?: string) => {
    if (!sessionId) return;
    try {
      setNotesLoading(true);
      await NotesService.createNote({
        title,
        content,
        subject,
        session_id: sessionId,
        permission_level: 'public'
      });
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await NotesService.deleteNote(noteId);
      toast({
        title: "Note deleted",
        description: "Shared note removed successfully."
      });
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleReflectionSubmit = async (rating: number, notes: string) => {
    setSavingReflection(true);
    try {
      if (sessionId) {
        const minutesStudied = Math.round(sessions * (workDuration / 60));
        await StudySessionsService.updateSession(sessionId, {
          reflection_rating: rating,
          reflection_notes: notes,
          status: 'finished',
          actual_end: new Date().toISOString(),
          minutes_studied: minutesStudied
        } as any);

        if (user) {
          await supabase
            .from('session_participants')
            .update({ minutes_studied: minutesStudied })
            .eq('session_id', sessionId)
            .eq('user_id', user.id);
        }
      }
      resetTimer();
    } catch (err) {
      console.error('Failed to submit reflection:', err);
    } finally {
      setSavingReflection(false);
    }
  };

  const decoratedParticipants = participants.map(p => {
    const isOnline = onlineUsers.includes(p.user_id);
    return {
      ...p,
      status: isOnline ? p.status : 'away'
    };
  });

  return {
    sessionId,
    sessionData,
    participants: decoratedParticipants,
    goals,
    notes,
    isHost,
    loading,
    goalsLoading,
    notesLoading,
    sessionSubject,
    sessionTitle,
    hostName,
    startTime,
    settingsOpen,
    setSettingsOpen,
    reflectionOpen,
    setReflectionOpen,
    savingReflection,
    onLeaveSession,
    handleToggleStatus,
    handleKickParticipant,
    handleAddGoal,
    handleToggleGoal,
    handleDeleteGoal,
    handleAddNote,
    handleDeleteNote,
    handleReflectionSubmit,
    workDuration,
    breakDuration,
    longBreakDuration,
    timeLeft,
    isActive,
    mode,
    sessions,
    sessionGoal,
    progress,
    currentCycle,
    handleSettingsChange,
    toggleTimer,
    resetTimer,
    setSessionGoal,
    user
  };
};
