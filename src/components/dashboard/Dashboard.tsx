import { useState } from 'react';
import { Bell, BellDot, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/common/notifications/NotificationCenter';
import { useDashboardData, DashboardSession } from '@/hooks/useDashboardData';
import { TodaySessions } from './TodaySessions';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { StudyProgress } from './StudyProgress';
import { NotificationsService } from '@/services/database';
import { PAGE_TITLE_CLASS } from '@/constants/theme';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  hasUnreadNotifications?: boolean;
  onMarkAllNotificationsRead?: () => void;
}

export const Dashboard = ({ onNavigate, hasUnreadNotifications, onMarkAllNotificationsRead }: DashboardProps) => {
  const { loading, attendingSessions, userStats, recentActivity } = useDashboardData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleJoinSession = (session: DashboardSession) => {
    if (!onNavigate) return;
    if (session.isSolo) {
      onNavigate('study-session');
    } else {
      onNavigate(`group-study-session?id=${session.id}`);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back! Here's your study overview.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="relative flex items-center gap-2 rounded-xl border border-border bg-card/90 hover:bg-brand/10 hover:border-brand/40 text-card-foreground hover:text-brand transition-all duration-200 shadow-sm px-3.5 h-9"
          onClick={() => setNotificationsOpen(true)}
        >
          {hasUnreadNotifications ? <BellDot size={16} className="text-brand animate-pulse" /> : <Bell size={16} className="text-brand" />}
          <span className="font-semibold text-xs">Notifications</span>
          {hasUnreadNotifications && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-card"></div>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <TodaySessions sessions={attendingSessions} onJoin={handleJoinSession} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActions onAction={(action) => onNavigate && onNavigate(action)} />
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
