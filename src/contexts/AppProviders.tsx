import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalTimerProvider } from '@/contexts/GlobalTimerContext';
import { GroupEnrollmentProvider } from '@/contexts/GroupEnrollmentContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
                  {children}
                </TooltipProvider>
              </SessionProvider>
            </NotificationProvider>
          </GroupEnrollmentProvider>
        </GlobalTimerProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
