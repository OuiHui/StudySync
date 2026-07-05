import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StudySessionsService, NotesService } from '@/services/database';
import { ColorCustomizer } from '@/components/common/settings/ColorCustomizer';
import { ParticipantsList } from './ParticipantsList';
import { StudyGoals } from './StudyGoals';
import { SessionNotes } from './SessionNotes';
import { SessionChat } from './SessionChat';
import { TimerDisplay } from './TimerDisplay';
import { SessionSettings } from './SessionSettings';
import { SessionDetailsDialog } from './SessionDetailsDialog';
import { ReflectionDialog } from './ReflectionDialog';
import { Badge } from '@/components/ui/badge';
import { useTimer } from '@/hooks/useTimer';
import { useProfileData } from '@/hooks/useProfileData';

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

interface GroupStudySessionProps {
  onThemeChange?: (theme: { name: string; primary: string; secondary: string; gradient: string }) => void;
  currentTheme?: { name: string; primary: string; secondary: string; gradient: string };
  onChatWithParticipant?: (participant: { id: string; name: string; status: string; avatar: string }) => void;
}

export const GroupStudySession = ({
  onThemeChange,
  currentTheme,
  onChatWithParticipant
}: GroupStudySessionProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { userStats } = useProfileData();

  const urlSessionId = searchParams.get('id');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isHost, setIsHost] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(true);

  const [loading, setLoading] = useState(() => {
    const savedId = localStorage.getItem('active_group_session_id');
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

  const formatTimeStr = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const getEstimatedEndTime = () => {
    const start = startTime ? new Date(startTime) : new Date();
    // Calculate total minutes needed: goal * (work + break)
    const totalSeconds = sessionGoal * (workDuration + breakDuration);
    const end = new Date(start.getTime() + totalSeconds * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

      // Fetch creator profile separately to avoid schema caching / auth.users issues
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
      // Save minutes studied for this user before leaving
      await supabase
        .from('session_participants')
        .update({ minutes_studied: minutesStudied })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      await StudySessionsService.leaveSession(sessionId, user.id);
      localStorage.removeItem('active_group_session_id');
      toast({
        title: "Left session",
        description: `Successfully left and logged ${minutesStudied} minutes of study!`
      });
      navigate('/available-sessions');
    } catch (err) {
      console.error("Failed to leave session:", err);
    }
  };

  // Timer Tick sync callback
  const onTimerUpdate = async (
    isActive: boolean,
    timeLeft: number,
    initialTime?: number,
    mode?: 'work' | 'break',
    currentCycle?: number,
    pauseLogs?: { paused_at: string; resumed_at: string | null }[]
  ) => {
    if (!sessionId || !isHost) return;
    try {
      const updateData: any = {
        timer_is_active: isActive,
        timer_time_left: timeLeft,
      };
      if (initialTime !== undefined) updateData.timer_initial_time = initialTime;
      if (mode !== undefined) updateData.timer_mode = mode;
      if (currentCycle !== undefined) updateData.timer_current_cycle = currentCycle;
      if (pauseLogs !== undefined) updateData.timer_pause_logs = pauseLogs;

      await StudySessionsService.updateSessionTimer(sessionId, updateData);
    } catch (err) {
      console.error("Failed to update session timer in DB:", err);
    }
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
    isHost
  });

  // Participant Actions
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

  // Goals Actions
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

  // Notes Actions
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

        // Update host study minutes
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

  if (!sessionId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No active study session</h2>
        <p className="text-gray-500 mt-2">Join a session from the Study Groups tab first.</p>
      </div>
    );
  }

  const gradientClass = currentTheme?.gradient || 'from-blue-50 to-indigo-100';

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen bg-gradient-to-br ${gradientClass} dark:bg-none dark:bg-gray-905`}>
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-700 dark:text-gray-400 font-medium">Entering study room...</p>
      </div>
    );
  }


  return (
    <div className={`h-[100vh] flex flex-col p-4 bg-gradient-to-br ${gradientClass} dark:bg-none dark:bg-gray-905 overflow-hidden`}>
      {/* Row 1: Header */}
      <div className="flex justify-between items-center pb-3 border-b dark:border-gray-800 shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveSession}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 h-8 text-xs"
          >
            <LogOut size={14} className="mr-1.5" />
            Leave Session
          </Button>
          <div className="border-l dark:border-gray-700 pl-3">
            <h1 className="text-base font-bold text-gray-800 dark:text-white leading-none truncate max-w-md">
              {sessionTitle}
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {sessionData?.study_groups?.name ? `Group: ${sessionData.study_groups.name}` : "Collaborative session"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="h-8 text-xs flex items-center space-x-1 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50"
          >
            <MessageSquare size={14} />
            <span>{isChatOpen ? 'Hide Chat' : 'Show Chat'}</span>
          </Button>
          <ColorCustomizer
            onThemeChange={onThemeChange || (() => {})}
            currentTheme={currentTheme || {
              name: 'Default Blue',
              primary: '#3b82f6',
              secondary: '#1e40af',
              gradient: 'from-blue-50 to-indigo-100'
            }}
          />
        </div>
      </div>

      {/* Row 2: Participants list bar */}
      <div className="shrink-0 mt-2">
        <ParticipantsList
          participants={participants}
          currentUserId={user?.id}
          isHost={isHost}
          onToggleStatus={handleToggleStatus}
          onKickParticipant={handleKickParticipant}
          onChatWithParticipant={onChatWithParticipant}
        />
      </div>

      {/* Main Workspace Area: Left/Middle Grid (2/3 width) & Sidebar (1/3 width) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        {/* Workspace Column (Columns 1-2, taking 2/3 width) */}
        <div className={`${isChatOpen ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col gap-4 items-center justify-start pt-2`}>
          {/* Centered Timer Block */}
          <div className="w-full flex flex-col items-center py-2 select-none shrink-0">
            {/* Inline Details Panel */}
            <div className="w-full max-w-xl text-center space-y-2 select-none shrink-0 mb-4 bg-white/40 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200/10 backdrop-blur-sm shadow-sm">
              <h2 className="text-xl font-extrabold text-gray-800 dark:text-white leading-tight">
                {sessionTitle}
              </h2>
              
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Subject:</span>
                  <span className="text-gray-700 dark:text-gray-200">{sessionSubject || 'General'}</span>
                </div>
                <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Host:</span>
                  <span className="text-gray-700 dark:text-gray-200">{hostName || 'Anonymous'}</span>
                </div>
                <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Start:</span>
                  <span className="text-gray-700 dark:text-gray-200">{formatTimeStr(startTime)}</span>
                </div>
                <div className="h-3 w-[1px] bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Est. End:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{getEstimatedEndTime()}</span>
                </div>
              </div>
            </div>

            <TimerDisplay
              timeLeft={timeLeft}
              isActive={isActive}
              mode={mode}
              progress={progress}
              onToggle={toggleTimer}
              onReset={resetTimer}
              onFinish={() => setReflectionOpen(true)}
              showFinishButton={isHost && (isActive || timeLeft < workDuration)}
              onSettingsClick={isHost ? () => setSettingsOpen(true) : undefined}
            />

            {/* Metric Pills Row */}
            <div className="flex justify-center space-x-2 mt-4 shrink-0">
              <Badge variant="secondary" className="px-3 py-1 text-xs border border-gray-250/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 text-gray-705 dark:text-gray-300 rounded-full font-medium">
                {sessions} / {sessionGoal} sessions
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-xs border border-gray-250/20 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 text-gray-705 dark:text-gray-300 rounded-full font-medium">
                {Math.round(sessions * (workDuration / 60))} minutes studied
              </Badge>
            </div>
          </div>

          {/* Lower Cards Row: Goals and Shared Materials 50/50 side-by-side */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start mt-2">
            <StudyGoals
              goals={goals}
              loading={goalsLoading}
              isHost={isHost}
              onAddGoal={handleAddGoal}
              onToggleGoal={handleToggleGoal}
              onDeleteGoal={handleDeleteGoal}
            />
            <SessionNotes
              notes={notes}
              loading={notesLoading}
              currentUserId={user?.id}
              isHost={isHost}
              groupId={sessionData?.group_id || undefined}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        </div>

        {/* Group Chat Column (Column 3, taking 1/3 width, full height) */}
        {isChatOpen && (
          <div className="lg:col-span-1 flex flex-col h-full min-h-0">
            <SessionChat
              groupId={sessionData?.group_id || undefined}
              groupName={sessionData?.study_groups?.name || "Session Chat"}
            />
          </div>
        )}
      </div>

      <SessionSettings
        workDuration={workDuration}
        breakDuration={breakDuration}
        longBreakDuration={longBreakDuration}
        sessionGoal={sessionGoal}
        onSettingsChange={handleSettingsChange}
        onSessionGoalChange={setSessionGoal}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <ReflectionDialog
        isOpen={reflectionOpen}
        onClose={() => setReflectionOpen(false)}
        onSubmit={handleReflectionSubmit}
        loading={savingReflection}
      />
    </div>
  );
};