import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsService } from '@/services/database';

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
    const checkUnreadNotifications = async () => {
      if (!user) {
        setHasUnreadNotifications(false);
        return;
      }
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
