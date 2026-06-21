import React from 'react';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasUnreadNotifications, handleMarkAllNotificationsRead } = useNotifications();

  const handleNavigate = (tab: string) => {
    navigate(tab === 'dashboard' ? '/' : `/${tab}`);
  };

  return (
    <DashboardComponent 
      onNavigate={handleNavigate}
      hasUnreadNotifications={hasUnreadNotifications}
      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
    />
  );
}
