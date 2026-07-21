import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProfileModalProvider } from "@/contexts/UserProfileModalContext";

import { GlobalTimerProvider } from "@/contexts/GlobalTimerContext";
import { GroupEnrollmentProvider } from "@/contexts/GroupEnrollmentContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SessionProvider } from "@/contexts/SessionContext";

import { Auth } from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import MainLayout from "@/layouts/MainLayout";

import Dashboard from "@/pages/Dashboard";
import SoloStudy from "@/pages/SoloStudy";
import GroupSessions from "@/pages/GroupSessions";
import AvailableSessions from "@/pages/AvailableSessions";
import MyGroups from "@/pages/MyGroups";
import Notes from "@/pages/Notes";
import Profile from "@/pages/Profile";
import Friends from "@/pages/Friends";
import Messages from "@/pages/Messages";
import { SimulationConsole } from "@/components/common/developer/SimulationConsole";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="study-app-theme">
      <AuthProvider>
        <GlobalTimerProvider>
          <GroupEnrollmentProvider>
            <NotificationProvider>
              <SessionProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <HashRouter>
                    <UserProfileModalProvider>
                      <Routes>
                        <Route path="/auth" element={
                          <AuthRoute>
                            <Auth />
                          </AuthRoute>
                        } />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <MainLayout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<Dashboard />} />
                          <Route path="study-session" element={<SoloStudy />} />
                          <Route path="group-study-session" element={<GroupSessions />} />
                          <Route path="available-sessions" element={<AvailableSessions />} />
                          <Route path="groups" element={<MyGroups />} />
                          <Route path="messages" element={<Messages />} />
                          <Route path="notes" element={<Notes />} />
                          <Route path="friends" element={<Friends />} />
                          <Route path="profile" element={<Profile />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      {import.meta.env.DEV && <SimulationConsole />}
                    </UserProfileModalProvider>
                  </HashRouter>
                </TooltipProvider>
              </SessionProvider>
            </NotificationProvider>
          </GroupEnrollmentProvider>
        </GlobalTimerProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
