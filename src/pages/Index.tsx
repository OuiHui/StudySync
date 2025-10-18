
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { StudySession } from '@/components/study/StudySession';
import { GroupStudySession } from '@/components/study/GroupStudySession';
import { StudyGroups } from '@/components/groups/StudyGroups';
import { Notes } from '@/components/notes/Notes';
import { Profile } from '@/components/profile/Profile';
import { ColorCustomizer } from '@/components/settings/ColorCustomizer';
import { AvailableSessionsList } from '@/components/study/AvailableSessionsList';
import { GroupPage } from '@/components/groups/GroupPage';
import { StudyGroupsBrowse } from '@/components/groups/StudyGroupsBrowse';
import { GlobalTimerIndicator } from '@/components/study/GlobalTimerIndicator';
import { LeaveSessionDialog } from '@/components/study/LeaveSessionDialog';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isInGroupSession, setIsInGroupSession] = useState(false);
  const [showLeaveSessionDialog, setShowLeaveSessionDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [groupEnrollments, setGroupEnrollments] = useState<Record<string, boolean>>({
    '1': true,
    '4': true
  });
  const [currentTheme, setCurrentTheme] = useState({
    name: 'Default Blue',
    primary: '#3b82f6',
    secondary: '#1e40af',
    gradient: 'from-blue-50 to-indigo-100'
  });

  // Global timer state that persists across pages
  const [globalTimer, setGlobalTimer] = useState({
    isActive: false,
    timeLeft: 25 * 60, // Start at 25 minutes instead of 0
    initialTime: 25 * 60,
    mode: 'work' as 'work' | 'break',
    isGroupTimer: false,
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  });

  // Notification state
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (globalTimer.isActive && globalTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setGlobalTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (globalTimer.timeLeft === 0 && globalTimer.isActive) {
      setGlobalTimer(prev => ({
        ...prev,
        isActive: false
      }));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [globalTimer.isActive, globalTimer.timeLeft]);

  // Redirect to group session if in active group session
  useEffect(() => {
    if (isInGroupSession && activeTab === 'available-sessions') {
      setActiveTab('group-study-session');
    }
  }, [activeTab, isInGroupSession]);

  // Store global timer state on window object for group sessions
  useEffect(() => {
    (window as any).globalTimerState = globalTimer;
  }, [globalTimer]);

  const handleThemeChange = (theme: typeof currentTheme) => {
    setCurrentTheme(theme);
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  };

  const handleUpdateEnrollment = (groupId: string, enrolled: boolean) => {
    setGroupEnrollments(prev => ({
      ...prev,
      [groupId]: enrolled
    }));
  };

  const handleTimerUpdate = (isActive: boolean, timeLeft: number, initialTime?: number, mode?: 'work' | 'break', isGroupTimer: boolean = false) => {
    // Only update timer if it's from the same source (solo vs group)
    const shouldUpdate = globalTimer.isGroupTimer === isGroupTimer;
    
    if (shouldUpdate) {
      setGlobalTimer(prev => ({
        ...prev,
        isActive,
        timeLeft,
        initialTime: initialTime !== undefined ? initialTime : prev.initialTime,
        mode: mode !== undefined ? mode : prev.mode,
        isGroupTimer
      }));
    }
  };

  const handleGlobalTimerToggle = () => {
    setGlobalTimer(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  const handleJoinSession = () => {
    // Check if there's an active solo timer and warn about joining group session
    if (globalTimer.isActive && !globalTimer.isGroupTimer) {
      setPendingNavigation('group-study-session');
      setShowLeaveSessionDialog(true);
      return;
    }
    
    setIsInGroupSession(true);
    setActiveTab('group-study-session');
  };

  const handleLeaveSession = () => {
    setIsInGroupSession(false);
    // Clear group timer when leaving session
    setGlobalTimer(prev => ({
      ...prev,
      isActive: false,
      timeLeft: 0,
      isGroupTimer: false
    }));
    setActiveTab('available-sessions');
  };

  const handleMarkAllNotificationsRead = () => {
    setHasUnreadNotifications(false);
  };

  const handleSidebarNavigation = (newTab: string) => {
    // Only show warning when trying to join a group session while solo timer is active
    if (newTab === 'available-sessions' && globalTimer.isActive && !globalTimer.isGroupTimer) {
      setPendingNavigation(newTab);
      setShowLeaveSessionDialog(true);
      return;
    }

    // Normal navigation for all other cases
    setActiveTab(newTab);
  };

  const handleConfirmLeaveSession = () => {
    // Stop the current timer and proceed with navigation
    setGlobalTimer(prev => ({
      ...prev,
      isActive: false,
      timeLeft: 0,
      isGroupTimer: false
    }));
    
    if (pendingNavigation === 'group-study-session') {
      setIsInGroupSession(true);
      setActiveTab('group-study-session');
    } else if (pendingNavigation) {
      setActiveTab(pendingNavigation);
    }
    
    setShowLeaveSessionDialog(false);
    setPendingNavigation(null);
  };

  const handleCancelLeaveSession = () => {
    setShowLeaveSessionDialog(false);
    setPendingNavigation(null);
  };

  // Determine background gradient based on timer state
  const getBackgroundGradient = () => {
    if (globalTimer.isActive && globalTimer.timeLeft > 0) {
      if (globalTimer.mode === 'work') {
        return 'from-blue-100 via-purple-50 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20';
      } else {
        return 'from-green-100 via-emerald-50 to-teal-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20';
      }
    }
    return 'from-background to-muted dark:from-background dark:to-muted';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={setActiveTab} 
            hasUnreadNotifications={hasUnreadNotifications}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />
        );
      case 'study-session':
        // Prevent solo timer if group timer is active
        if (globalTimer.isGroupTimer && globalTimer.isActive) {
          return (
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Group Timer Active
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You cannot start a solo study session while a group timer is running.
              </p>
              <button
                onClick={() => setActiveTab('group-study-session')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
              >
                Return to Group Session
              </button>
            </div>
          );
        }
        return (
          <StudySession 
            onTimerUpdate={(isActive, timeLeft, initialTime, mode) => 
              handleTimerUpdate(isActive, timeLeft, initialTime, mode, false)
            }
            globalTimerState={globalTimer.isGroupTimer ? undefined : globalTimer}
          />
        );
      case 'group-study-session':
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
      case 'available-sessions':
        return <AvailableSessionsList onJoinSession={handleJoinSession} />;
      case 'groups':
        return <StudyGroups onSelectGroup={setSelectedGroupId} />;
      case 'browse-groups':
        return selectedGroupId ? (
          <GroupPage 
            groupId={selectedGroupId} 
            onBack={() => setSelectedGroupId(null)}
            isEnlisted={groupEnrollments[selectedGroupId]}
            onUpdateEnrollment={handleUpdateEnrollment}
          />
        ) : (
          <StudyGroupsBrowse 
            onSelectGroup={setSelectedGroupId} 
            groupEnrollments={groupEnrollments}
            onUpdateEnrollment={handleUpdateEnrollment}
          />
        );
      case 'notes':
        return <Notes />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={setActiveTab} hasUnreadNotifications={hasUnreadNotifications} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} flex transition-all duration-1000`} style={{
      '--box-bg': currentTheme.primary + '10',
      '--box-border': currentTheme.primary + '30',
      '--accent': currentTheme.primary
    } as React.CSSProperties}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSidebarNavigation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {activeTab !== 'study-session' && activeTab !== 'group-study-session' && (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-end mb-4">
                <ColorCustomizer 
                  onThemeChange={handleThemeChange} 
                  currentTheme={currentTheme}
                />
              </div>
              {renderContent()}
            </div>
          </div>
        )}
        {(activeTab === 'study-session' || activeTab === 'group-study-session') && (
          <div className="relative">
            {renderContent()}
          </div>
        )}
      </main>

      {/* Global Timer Indicator - show when timer has time and not on timer pages, only show if timer has been started */}
      {globalTimer.timeLeft > 0 && globalTimer.timeLeft < (globalTimer.initialTime || 25 * 60) && activeTab !== 'study-session' && activeTab !== 'group-study-session' && (
        <GlobalTimerIndicator
          timeLeft={globalTimer.timeLeft}
          isActive={globalTimer.isActive}
          onToggle={handleGlobalTimerToggle}
          formatTime={globalTimer.formatTime}
        />
      )}

      {/* Leave Session Dialog */}
      <LeaveSessionDialog
        isOpen={showLeaveSessionDialog}
        onClose={handleCancelLeaveSession}
        onConfirm={handleConfirmLeaveSession}
        timerActive={globalTimer.isActive}
      />
    </div>
  );
};

export default Index;
