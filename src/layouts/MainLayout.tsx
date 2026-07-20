import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/common/layout/Sidebar';
import { ColorCustomizer } from '@/components/common/settings/ColorCustomizer';
import { GlobalTimerIndicator } from '@/components/study/GlobalTimerIndicator';
import { LeaveSessionDialog } from '@/components/study/LeaveSessionDialog';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardQueryOptions } from '@/hooks/useDashboardData';
import { getProfileQueryOptions } from '@/hooks/useProfileData';
import { getStudyEventsQueryOptions } from '@/hooks/useStudyEvents';
import { StudySessionsService, StudyGroupsService, NotesService } from '@/services/database';
import { DEFAULT_THEME, getBackgroundGradient as getThemeBackgroundGradient } from '@/constants/theme';

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME);
  
  const { globalTimer, handleGlobalTimerToggle, handleCancelTimer } = useGlobalTimer();
  const { 
    isInGroupSession, 
    showLeaveSessionDialog, 
    setShowLeaveSessionDialog,
    pendingNavigation,
    setPendingNavigation,
    setIsInGroupSession,
    sessionStarted
  } = useSession();
  
  useEffect(() => {
    if (user && !authLoading) {
      queryClient.prefetchQuery(getDashboardQueryOptions(user));
      queryClient.prefetchQuery(getProfileQueryOptions(user, authLoading));
      queryClient.prefetchQuery(getStudyEventsQueryOptions(user));
      queryClient.prefetchQuery({
        queryKey: ['notes', 'user', user.id],
        queryFn: () => NotesService.getNotes(),
        staleTime: 5 * 60 * 1000
      });
      queryClient.prefetchQuery({
        queryKey: ['user-groups', user.id],
        queryFn: () => StudyGroupsService.getUserGroups(),
        staleTime: 5 * 60 * 1000
      });
      queryClient.prefetchQuery({
        queryKey: ['available-sessions', user.id],
        queryFn: () => StudySessionsService.getAvailableSessions(),
        staleTime: 5 * 60 * 1000
      });
    }
  }, [user, authLoading, queryClient]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isSession = location.pathname.includes('study-session') || location.pathname.includes('group-study-session');
      if (globalTimer.isActive || isSession) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave your study session? Your progress might not be saved.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [globalTimer.isActive, location.pathname]);

  const handleThemeChange = (theme: typeof currentTheme) => {
    setCurrentTheme(theme);
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  };

  const getBackgroundGradient = () => {
    return getThemeBackgroundGradient(globalTimer);
  };

  const isSessionPage = location.pathname.includes('study-session') || location.pathname.includes('group-study-session');
  const isGroupSessionPage = location.pathname.includes('group-study-session');

  // Convert pathname to the activeTab equivalent for Sidebar
  const currentPath = location.pathname.substring(1) || 'dashboard';

  const handleSidebarNavigation = (newTab: string) => {
    const path = newTab === 'dashboard' ? '/' : `/${newTab}`;
    
    // If we are navigating away from group study session and it hasn't started yet,
    // bypass the warning dialog but leave the session.
    if (path !== location.pathname && isGroupSessionPage && !sessionStarted) {
      handleConfirmLeaveSession(path);
      return;
    }
    
    // Only show leave dialog for active group sessions or group session page that has started
    if (path !== location.pathname && (
      (isGroupSessionPage && sessionStarted) || 
      (globalTimer.isActive && globalTimer.isGroupTimer)
    )) {
      setPendingNavigation(path);
      setShowLeaveSessionDialog(true);
      return;
    }
    
    navigate(path);
  };

  const handleCancelLeaveSession = () => {
    setShowLeaveSessionDialog(false);
    setPendingNavigation(null);
  };

  const handleConfirmLeaveSession = async (directPath?: string) => {
    handleCancelTimer(); // stops and resets
    
    // Call leaveSession if we were in a group study session
    const savedSessionId = localStorage.getItem('active_group_session_id');
    if (savedSessionId && user) {
      try {
        await StudySessionsService.leaveSession(savedSessionId);
      } catch (err) {
        console.error("Failed to leave session from layout:", err);
      }
      localStorage.removeItem('active_group_session_id');
    }

    setIsInGroupSession(false);
    const targetPath = directPath || pendingNavigation;
    if (targetPath) {
      navigate(targetPath);
    }
    setShowLeaveSessionDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} flex transition-all duration-1000 ease-in-out`} style={{
      '--box-bg': currentTheme.primary + '10',
      '--box-border': currentTheme.primary + '30',
      '--accent': currentTheme.primary
    } as React.CSSProperties}>
      <Sidebar 
        activeTab={currentPath} 
        setActiveTab={handleSidebarNavigation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {!isSessionPage ? (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-end mb-4">
                <ColorCustomizer 
                  onThemeChange={handleThemeChange} 
                  currentTheme={currentTheme}
                />
              </div>
              <Outlet context={{ currentTheme, handleThemeChange }} />
            </div>
          </div>
        ) : (
          <div className="relative">
            <Outlet context={{ currentTheme, handleThemeChange }} />
          </div>
        )}
      </main>

      {globalTimer.timeLeft > 0 && globalTimer.timeLeft < (globalTimer.initialTime || 25 * 60) && !isSessionPage && (
        <GlobalTimerIndicator
          timeLeft={globalTimer.timeLeft}
          isActive={globalTimer.isActive}
          onToggle={handleGlobalTimerToggle}
          onCancel={handleCancelTimer}
          formatTime={globalTimer.formatTime}
        />
      )}

      <LeaveSessionDialog
        isOpen={showLeaveSessionDialog}
        onClose={handleCancelLeaveSession}
        onConfirm={() => handleConfirmLeaveSession()}
        timerActive={globalTimer.isActive}
      />
    </div>
  );
};

export default MainLayout;
