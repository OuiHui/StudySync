import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/common/layout/Sidebar';
import { ColorCustomizer } from '@/components/common/settings/ColorCustomizer';
import { GlobalTimerIndicator } from '@/components/study/GlobalTimerIndicator';
import { LeaveSessionDialog } from '@/components/study/LeaveSessionDialog';
import { useGlobalTimer } from '@/contexts/GlobalTimerContext';
import { useSession } from '@/contexts/SessionContext';

// Assuming ThemeContext provides currentTheme, but it might just be local state right now.
// For now, we will use a basic theme state here as it was in Index.tsx, or we can use the global ThemeProvider.
// Wait, in Index.tsx, currentTheme was local state. Let's keep it here for now.
const initialTheme = {
  name: 'Default Blue',
  primary: '#3b82f6',
  secondary: '#1e40af',
  gradient: 'from-blue-50 to-indigo-100'
};

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  
  const { globalTimer, handleGlobalTimerToggle, handleCancelTimer } = useGlobalTimer();
  const { 
    isInGroupSession, 
    showLeaveSessionDialog, 
    setShowLeaveSessionDialog,
    pendingNavigation,
    setPendingNavigation,
    setIsInGroupSession
  } = useSession();

  const handleThemeChange = (theme: typeof currentTheme) => {
    setCurrentTheme(theme);
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  };

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

  const isSessionPage = location.pathname.includes('study-session') || location.pathname.includes('group-study-session');

  // Convert pathname to the activeTab equivalent for Sidebar
  const currentPath = location.pathname.substring(1) || 'dashboard';

  const handleSidebarNavigation = (newTab: string) => {
    if (newTab === 'available-sessions' && globalTimer.isActive && !globalTimer.isGroupTimer) {
      setPendingNavigation('/' + newTab);
      setShowLeaveSessionDialog(true);
      return;
    }
    const path = newTab === 'dashboard' ? '/' : `/${newTab}`;
    navigate(path);
  };

  const handleCancelLeaveSession = () => {
    setShowLeaveSessionDialog(false);
    setPendingNavigation(null);
  };

  const handleConfirmLeaveSession = () => {
    handleCancelTimer(); // stops and resets
    if (pendingNavigation) {
      navigate(pendingNavigation);
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
        onConfirm={handleConfirmLeaveSession}
        timerActive={globalTimer.isActive}
      />
    </div>
  );
};

export default MainLayout;
