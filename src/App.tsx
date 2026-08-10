import { Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { UserProfileModalProvider } from "@/contexts/UserProfileModalContext";
import { AppProviders } from "@/contexts/AppProviders";
import MainLayout from "@/layouts/MainLayout";
import { SimulationConsole } from "@/components/common/developer/SimulationConsole";
import { handleOAuthErrorRedirect } from "@/utils/oauthHandler";
import { ProtectedRoute, AuthRoute } from "@/components/common/RouteGuards";
import { PageFallback } from "@/components/common/LoadingScreen";

import { Auth } from "@/pages/Auth";
import AuthCallback from "@/pages/Auth/Callback";
import Dashboard from "@/pages/Dashboard";
import SoloStudy from "@/pages/SoloStudy";
import GroupSessions from "@/pages/GroupSessions";
import AvailableSessions from "@/pages/AvailableSessions";
import MyGroups from "@/pages/MyGroups";
import Notes from "@/pages/Notes";
import Profile from "@/pages/Profile";
import Friends from "@/pages/Friends";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";

handleOAuthErrorRedirect();

const App = () => (
  <AppProviders>
    <HashRouter>
      <UserProfileModalProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              path="/auth"
              element={
                <AuthRoute>
                  <Auth />
                </AuthRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
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
        </Suspense>
        {import.meta.env.DEV && <SimulationConsole />}
      </UserProfileModalProvider>
    </HashRouter>
  </AppProviders>
);

export default App;
