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
  const { setIsInGroupSession } = useSession();
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
      
      setSessionData(data);
      if (user) {
        setIsHost(data.created_by === user.id);
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
      if (user && data && !data.some((p: any) => p.user_id === user.id)) {
        await StudySessionsService.joinSession(id, user.id, 'participant');
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${id}` }, () => {
        loadParticipants(id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_goals', filter: `session_id=eq.${id}` }, () => {
        loadGoals(id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `session_id=eq.${id}` }, () => {
        loadNotes(id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions', filter: `id=eq.${id}` }, () => {
        loadSessionDetails(id);
      })
      .subscribe();

    channelRef.current = channel;
  };

  useEffect(() => {
    if (!sessionId || !user) return;

    const init = async () => {
      const savedId = localStorage.getItem('active_group_session_id');
      const hasCache = localStorage.getItem('cached_session_title');
      if (!(savedId && hasCache)) {
        setLoading(true);
      }
      await loadSessionDetails(sessionId);
      await loadParticipants(sessionId);
      await loadGoals(sessionId);
      await loadNotes(sessionId);
      setupRealTimeSync(sessionId);
      setLoading(false);
    };

    init();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, user]);

  const onLeaveSession = async () => {
    if (!sessionId || !user) return;
    try {
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
    setSessionGoal
  } = useTimer({
    onTimerUpdate,
    globalTimerState: (window as any).globalTimerState,
    sessionId: sessionId || undefined,
    isHost,
    sessionData
  });

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
      toast({
        title: "Participant removed",
        description: "Successfully removed the participant from the session."
      });
    } catch (err) {
      console.error("Failed to kick participant:", err);
    }
  };

  const handleAddGoal = async (title: string) => {
    if (!sessionId || !isHost) return;
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
    if (!isHost) return;
    try {
      await StudySessionsService.updateGoal(goalId, { completed });
    } catch (err) {
      console.error("Failed to toggle goal:", err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!isHost) return;
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

  return {
    sessionId,
    sessionData,
    participants,
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
