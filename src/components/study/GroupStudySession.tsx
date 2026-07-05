import { useState } from 'react';
import { LogOut, Loader2, MessageSquare, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorCustomizer } from '@/components/common/settings/ColorCustomizer';
import { ParticipantsList } from './ParticipantsList';
import { StudyGoals } from './StudyGoals';
import { SessionNotes } from './SessionNotes';
import { SessionChat } from './SessionChat';
import { TimerDisplay } from './TimerDisplay';
import { SessionSettings } from './SessionSettings';
import { SessionInfoPanel } from './SessionInfoPanel';
import { ReflectionDialog } from './ReflectionDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGroupStudySessionData } from '@/hooks/useGroupStudySessionData';

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
  const {
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
  } = useGroupStudySessionData();

  const [isChatOpen, setIsChatOpen] = useState(true);

  const getEstimatedEndTime = () => {
    const start = startTime ? new Date(startTime) : new Date();
    const totalSeconds = sessionGoal * (workDuration + breakDuration);
    const end = new Date(start.getTime() + totalSeconds * 1000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          {/* Centered Timer Block with Restored Workspace Cards */}
          <div className="w-full flex flex-col items-center select-none shrink-0">
            {/* Session Info Panel */}
            <SessionInfoPanel
              sessionTitle={sessionTitle}
              sessionCourse={sessionSubject}
              hostName={hostName}
              startTime={startTime}
              estimatedEndTime={getEstimatedEndTime()}
            />

            {/* Sub-grid of Cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Work Session Card */}
              <Card className="md:col-span-2 border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="pb-2 border-b dark:border-gray-700/50">
                  <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-white">
                    Work Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <TimerDisplay
                    timeLeft={timeLeft}
                    isActive={isActive}
                    mode={mode}
                    progress={progress}
                    onToggle={toggleTimer}
                    onReset={resetTimer}
                    onFinish={() => setReflectionOpen(true)}
                    showFinishButton={isHost && (isActive || timeLeft < workDuration)}
                  />
                </CardContent>
              </Card>

              {/* Sidebar Cards */}
              <div className="md:col-span-1 flex flex-col gap-4">
                {/* Today's Progress Card */}
                <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col h-full">
                  <CardHeader className="pb-2 border-b dark:border-gray-700/50">
                    <CardTitle className="text-sm font-semibold text-gray-800 dark:text-white">
                      Today's Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6 px-4 flex-1">
                    <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                      {sessions}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">
                      Sessions Completed
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-3">
                      <div 
                        className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300" 
                        style={{ width: `${Math.min((sessions / sessionGoal) * 100, 100)}%` }} 
                      />
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-305">
                      <span>Goal: {sessionGoal} sessions</span>
                      {isHost && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          onClick={() => setSettingsOpen(true)}
                        >
                          <Pencil size={12} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Timer Configuration Card */}
                <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
                  <CardHeader className="pb-2 border-b dark:border-gray-700/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-gray-800 dark:text-white">
                      Timer Configuration
                    </CardTitle>
                    {isHost && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={() => setSettingsOpen(true)}
                      >
                        <Pencil size={12} />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Work Duration</span>
                      <span className="text-gray-800 dark:text-white font-semibold">{workDuration / 60} min</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Break Duration</span>
                      <span className="text-gray-800 dark:text-white font-semibold">{breakDuration / 60} min</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Long Break</span>
                      <span className="text-gray-800 dark:text-white font-semibold">{longBreakDuration / 60} min</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
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