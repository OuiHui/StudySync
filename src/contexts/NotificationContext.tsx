import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsService } from '@/services/database';
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
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          checkUnreadNotifications();
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
