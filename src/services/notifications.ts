import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from './utils';
import { EmailService } from './email';

export class NotificationsService {
  static async createNotification(notificationData: {
    user_id: string;
    type: 'session' | 'group' | 'note' | 'friend';
    title: string;
    message: string;
    sender_id?: string;
    actionable?: boolean;
    friendship_id?: string;
    group_id?: string;
    session_id?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          sender_id: notificationData.sender_id || null,
          actionable: notificationData.actionable ?? false,
          friendship_id: notificationData.friendship_id || null,
          group_id: notificationData.group_id || null,
          session_id: notificationData.session_id || null,
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'create notification');
      }

      // Check recipient profile for email notifications
      try {
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('email, notification_settings')
          .eq('user_id', notificationData.user_id)
          .single();

        if (recipientProfile && recipientProfile.email) {
          await EmailService.processNotificationEmail(
            data,
            recipientProfile.email,
            recipientProfile.notification_settings as any
          );
        }
      } catch (emailErr) {
        console.error('Failed to process email notification:', emailErr);
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        handleDbError(error, 'fetch user notifications');
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'mark notification as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead() {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .select();

      if (error) {
        handleDbError(error, 'mark all notifications as read');
      }

      return data || [];
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', session.user.id);

      if (error) {
        handleDbError(error, 'delete notification');
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}