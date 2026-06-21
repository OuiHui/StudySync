import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface NotificationContextType {
  hasUnreadNotifications: boolean;
  handleMarkAllNotificationsRead: () => void;
  setHasUnreadNotifications: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

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
