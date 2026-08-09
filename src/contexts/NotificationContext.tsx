import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsService, ProfileService, EmailService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationContextType {
  hasUnreadNotifications: boolean;
  handleMarkAllNotificationsRead: () => void;
  setHasUnreadNotifications: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setHasUnreadNotifications(false);
      return;
    }

    const checkUnreadNotifications = async () => {
      try {
        const userNotifications = await NotificationsService.getUserNotifications();
        const hasUnread = userNotifications.some((n: any) => !n.read);
        setHasUnreadNotifications(hasUnread);
      } catch (error) {
        console.error('Error fetching user notifications:', error);
        setHasUnreadNotifications(false);
      }
    };

    checkUnreadNotifications();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        async (payload) => {
          const row = payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old;
          if (row && (!('user_id' in row) || (row as any).user_id === user.id)) {
            checkUnreadNotifications();
          }

          // If a new notification was inserted for the current user, process email dispatch
          if (payload.eventType === 'INSERT' && payload.new && (payload.new as any).user_id === user.id) {
            try {
              const notif = payload.new as any;
              const profile = await ProfileService.getCurrentUser();
              const prof = profile as any;
              if (user.email) {
                await EmailService.processNotificationEmail(
                  notif,
                  user.email,
                  prof?.notification_settings
                );
              }
            } catch (emailErr) {
              console.error('Error processing email notification from realtime trigger:', emailErr);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAllNotificationsRead = () => {
    setHasUnreadNotifications(false);
  };


  return (
    <NotificationContext.Provider value={{ hasUnreadNotifications, handleMarkAllNotificationsRead, setHasUnreadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
