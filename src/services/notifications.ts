import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from './utils';

export class NotificationsService {
  static async getUserNotifications() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('notifications' as any)
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
        .from('notifications' as any)
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
        .from('notifications' as any)
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
        .from('notifications' as any)
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