import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { UserProfileModalProvider } from "@/contexts/UserProfileModalContext";
import { AppProviders } from "@/contexts/AppProviders";
import MainLayout from "@/layouts/MainLayout";
import { SimulationConsole } from "@/components/common/developer/SimulationConsole";
import { handleOAuthErrorRedirect } from "@/utils/oauthHandler";
import { ProtectedRoute, AuthRoute } from "@/components/common/RouteGuards";
import { PageFallback } from "@/components/common/LoadingScreen";

const Auth = lazy(() => import("@/pages/Auth").then(m => ({ default: m.Auth })));
const AuthCallback = lazy(() => import("@/pages/Auth/Callback"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SoloStudy = lazy(() => import("@/pages/SoloStudy"));
const GroupSessions = lazy(() => import("@/pages/GroupSessions"));
const AvailableSessions = lazy(() => import("@/pages/AvailableSessions"));
const MyGroups = lazy(() => import("@/pages/MyGroups"));
const Notes = lazy(() => import("@/pages/Notes"));
const Profile = lazy(() => import("@/pages/Profile"));
const Friends = lazy(() => import("@/pages/Friends"));
const Messages = lazy(() => import("@/pages/Messages"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
