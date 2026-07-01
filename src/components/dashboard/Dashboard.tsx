import { useState } from 'react';
import { Bell, BellDot, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/common/notifications/NotificationCenter';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardStats } from './DashboardStats';
import { TodaySessions } from './TodaySessions';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { StudyProgress } from './StudyProgress';
import { NotificationsService } from '@/services/database';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  hasUnreadNotifications?: boolean;
  onMarkAllNotificationsRead?: () => void;
}

export const Dashboard = ({ onNavigate, hasUnreadNotifications, onMarkAllNotificationsRead }: DashboardProps) => {
  const { loading, attendingSessions, userStats, recentActivity } = useDashboardData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleQuickAction = (action: string) => {
    if (onNavigate) {
      onNavigate(action);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationsService.markAllAsRead();
      if (onMarkAllNotificationsRead) {
        onMarkAllNotificationsRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back! Here's your study overview.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="relative dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setNotificationsOpen(true)}
        >
          {hasUnreadNotifications ? <BellDot size={16} /> : <Bell size={16} />}
          <span className="ml-2">Notifications</span>
          {hasUnreadNotifications && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <DashboardStats stats={userStats} />
          <TodaySessions sessions={attendingSessions} onJoin={() => handleQuickAction('group-study-session')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActions onAction={handleQuickAction} />
            <RecentActivity activity={recentActivity} />
          </div>
          <StudyProgress stats={userStats} />
        </>
      )}

      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        hasUnread={hasUnreadNotifications || false}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};
