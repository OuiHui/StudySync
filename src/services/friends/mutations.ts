import { supabase } from '@/integrations/supabase/client';
import { checkAuth } from '../utils';

export class FriendsMutations {
  static async sendFriendRequest(friendId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to send friend requests');
      }

      const { data: existing } = await supabase
        .from('friendships' as any)
        .select('*')
        .or(`and(user_id.eq.${session.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${session.user.id})`)
        .maybeSingle();

      if (existing) {
        throw new Error('Friend request already exists or you are already friends');
      }

      const { data, error } = await supabase
        .from('friendships' as any)
        .insert({
          user_id: session.user.id,
          friend_id: friendId,
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  static async acceptFriendRequest(requestId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('friendships' as any)
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('friend_id', session.user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error accepting friend request:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  static async rejectFriendRequest(requestId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('friendships' as any)
        .delete()
        .eq('id', requestId)
        .eq('friend_id', session.user.id);

      if (error) {
        console.error('Error rejecting friend request:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }

  static async removeFriend(friendshipId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('friendships' as any)
        .delete()
        .eq('id', friendshipId)
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      if (error) {
        console.error('Error removing friend:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  static async cancelFriendRequest(requestId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('friendships' as any)
        .delete()
        .eq('id', requestId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error canceling friend request:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error canceling friend request:', error);
      throw error;
    }
  }
}
