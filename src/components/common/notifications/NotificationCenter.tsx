
import { useState, useEffect } from 'react';
import { Bell, BellDot, X, Check, UserPlus, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationsService, FriendsService, StudyGroupsService, StudySessionsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setHasUnreadNotifications } = useNotifications();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const channel = supabase
      .channel(`notification-center-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          const row = payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old;
          if (row && (!('user_id' in row) || (row as any).user_id === user.id)) {
            loadNotifications();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user]);

  useEffect(() => {
    if (user) {
      const stillUnread = notifications.some(n => !n.read);
      setHasUnreadNotifications(stillUnread);
    }
  }, [notifications, user, setHasUnreadNotifications]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userNotifications = await NotificationsService.getUserNotifications();
      setNotifications(userNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use only real notifications from the database
  const displayNotifications = notifications.length > 0 ? notifications.map(notification => ({
    id: notification.id,
    type: notification.type || 'note',
    title: notification.title || 'Notification',
    message: notification.message || '',
    time: new Date(notification.created_at).toLocaleString(),
    read: notification.read || false,
    actionable: notification.actionable || false,
    friendship_id: notification.friendship_id || null,
    group_id: notification.group_id || null,
    session_id: notification.session_id || null
  })) : [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'session': return <Calendar size={16} className="text-blue-500" />;
      case 'group': return <UserPlus size={16} className="text-green-500" />;
      case 'note': return <BookOpen size={16} className="text-purple-500" />;
      case 'friend': return <UserPlus size={16} className="text-orange-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationsService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (user) {
        // Since markAllAsRead method doesn't exist, just reload notifications
        await loadNotifications();
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        onMarkAllRead();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      await NotificationsService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadCount = displayNotifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border border-border shadow-2xl max-h-[80vh] overflow-y-auto bg-popover text-popover-foreground rounded-2xl">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-foreground font-bold">
              {unreadCount > 0 ? <BellDot size={20} className="mr-2 text-brand animate-pulse" /> : <Bell size={20} className="mr-2 text-brand" />}
              Notifications
            </CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-brand hover:text-brand-hover hover:bg-brand/10 font-semibold"
                >
                  <Check size={14} className="mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close notifications"
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {error && (
          <div className="px-6 pt-3 pb-2">
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <CardContent className="space-y-2 pt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <span className="ml-2 text-muted-foreground text-xs font-semibold">Loading notifications...</span>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={48} className="mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm font-medium">No notifications</p>
            </div>
          ) : (
            displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-xl border transition-colors ${
                  notification.read 
                    ? 'bg-muted/60 border-border text-foreground' 
                    : 'bg-brand/10 border-brand/30 text-foreground'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-foreground">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-2 font-medium">
                        {notification.time}
                      </p>
                      {notification.actionable && (
                        <div className="flex space-x-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-brand hover:bg-brand-hover text-primary-foreground font-semibold rounded-lg h-8 text-xs"
                            onClick={async () => {
                              try {
                                if (notification.type === 'friend' && notification.friendship_id) {
                                  await FriendsService.acceptFriendRequest(notification.friendship_id);
                                } else if (notification.type === 'group' && notification.group_id) {
                                  await StudyGroupsService.acceptGroupInvitation(notification.group_id);
                                  queryClient.invalidateQueries({ queryKey: ['user-groups'] });
                                } else if (notification.type === 'session' && notification.session_id) {
                                  await StudySessionsService.acceptSessionInvitation(notification.session_id);
                                  queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
                                  queryClient.invalidateQueries({ queryKey: ['available-sessions'] });
                                }
                                await removeNotification(notification.id);
                              } catch (err) {
                                console.error('Error accepting invitation:', err);
                              }
                            }}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-border text-foreground hover:bg-muted font-semibold rounded-lg h-8 text-xs"
                            onClick={async () => {
                              try {
                                if (notification.type === 'friend' && notification.friendship_id) {
                                  await FriendsService.rejectFriendRequest(notification.friendship_id);
                                } else if (notification.type === 'group' && notification.group_id) {
                                  await StudyGroupsService.declineGroupInvitation(notification.group_id);
                                  queryClient.invalidateQueries({ queryKey: ['user-groups'] });
                                } else if (notification.type === 'session' && notification.session_id) {
                                  await StudySessionsService.declineSessionInvitation(notification.session_id);
                                  queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
                                  queryClient.invalidateQueries({ queryKey: ['available-sessions'] });
                                }
                                await removeNotification(notification.id);
                              } catch (err) {
                                console.error('Error declining invitation:', err);
                              }
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
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="Remove"
                    >
                      <X size={12} />
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
