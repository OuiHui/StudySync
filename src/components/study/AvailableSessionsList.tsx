
import { Play, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateSessionDialog } from '@/components/study/CreateSessionDialog';
import { SessionDetailsPopup } from '@/components/study/SessionDetailsPopup';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { StudyCalendar } from '@/components/calendar/StudyCalendar';
import { PAGE_TITLE_CLASS } from '@/constants/theme';
import { SessionCard } from './SessionCard';
import { useAvailableSessionsState } from './useAvailableSessionsState';

interface AvailableSessionsListProps {
  onJoinSession: (sessionId: string) => void;
}

export const AvailableSessionsList = ({ onJoinSession }: AvailableSessionsListProps) => {
  const { openProfile } = useUserProfileModal();
  const {
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
  } = useAvailableSessionsState();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>Study Sessions</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Join or create collaborative study sessions</p>
        </div>
        <CreateSessionDialog onSessionCreated={loadSessions} />
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading study sessions...</span>
        </div>
      ) : (
        <>
          <StudyCalendar compact={true} />
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600 dark:text-green-400">
                <Play size={20} className="mr-2" />
                Live Sessions ({activeSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Play size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No Live Sessions</h3>
                  <p className="text-gray-600 dark:text-gray-300">No active study sessions at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      userId={user?.id}
                      confirmingSessionId={confirmingSessionId}
                      onOpenProfile={openProfile}
                      onOpenDetails={setSelectedSession}
                      onJoinSession={onJoinSession}
                      onTogglePlanToAttend={handleTogglePlanToAttend}
                      onCancelSession={handleCancelSession}
                      onSetConfirmingSessionId={setConfirmingSessionId}
                      onSessionUpdated={loadSessions}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600 dark:text-blue-400">
                <Calendar size={20} className="mr-2" />
                Upcoming Sessions ({plannedSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plannedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No Upcoming Sessions</h3>
                  <p className="text-gray-600 dark:text-gray-300">No scheduled study sessions</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {plannedSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      userId={user?.id}
                      confirmingSessionId={confirmingSessionId}
                      onOpenProfile={openProfile}
                      onOpenDetails={setSelectedSession}
                      onJoinSession={onJoinSession}
                      onTogglePlanToAttend={handleTogglePlanToAttend}
                      onCancelSession={handleCancelSession}
                      onSetConfirmingSessionId={setConfirmingSessionId}
                      onSessionUpdated={loadSessions}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedSession && (
        <SessionDetailsPopup
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession}
          onJoinSession={onJoinSession}
          onTogglePlanToAttend={handleTogglePlanToAttend}
          currentUser={user}
          onSessionUpdated={loadSessions}
        />
      )}
    </div>
  );
};
