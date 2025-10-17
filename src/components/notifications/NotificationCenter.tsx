
import { useState, useEffect } from 'react';
import { Bell, BellDot, X, Check, UserPlus, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'session' | 'group' | 'note' | 'friend';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionable?: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  hasUnread: boolean;
  onMarkAllRead: () => void;
}

export const NotificationCenter = ({ isOpen, onClose, hasUnread, onMarkAllRead }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'session',
      title: 'Study Session Starting',
      message: 'Advanced Mathematics session starts in 15 minutes',
      time: '2 min ago',
      read: false,
      actionable: true
    },
    {
      id: '2',
      type: 'group',
      title: 'New Group Invitation',
      message: 'Sarah invited you to join Physics Study Group',
      time: '1 hour ago',
      read: false,
      actionable: true
    },
    {
      id: '3',
      type: 'note',
      title: 'Note Shared',
      message: 'Mike shared new calculus notes in your group',
      time: '3 hours ago',
      read: true
    },
    {
      id: '4',
      type: 'friend',
      title: 'Friend Request',
      message: 'Emma Wilson sent you a friend request',
      time: '5 hours ago',
      read: false,
      actionable: true
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'session': return <Calendar size={16} className="text-blue-500" />;
      case 'group': return <UserPlus size={16} className="text-green-500" />;
      case 'note': return <BookOpen size={16} className="text-purple-500" />;
      case 'friend': return <UserPlus size={16} className="text-orange-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    onMarkAllRead();
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-0 shadow-xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center dark:text-white">
              {unreadCount > 0 ? <BellDot size={20} className="mr-2" /> : <Bell size={20} className="mr-2" />}
              Notifications
            </CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-blue-500 hover:text-blue-600"
                >
                  <Check size={14} className="mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors ${
                  notification.read 
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-800 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {notification.time}
                      </p>
                      {notification.actionable && (
                        <div className="flex space-x-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => {
                              console.log('Accepted invitation:', notification.id);
                              removeNotification(notification.id);
                            }}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="dark:border-gray-600 dark:text-gray-300"
                            onClick={() => {
                              console.log('Declined invitation:', notification.id);
                              removeNotification(notification.id);
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="Mark as read"
                      >
                        <Check size={12} className="text-gray-500" />
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Remove"
                    >
                      <X size={12} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
