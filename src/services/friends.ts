import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class FriendsService {
  // Search for users by email or display name
  static async searchUsers(searchTerm: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        current_user_id: session.user.id
      });

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get all friends (accepted friendships)
  static async getUserFriends() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get accepted friendships where user is either sender or receiver
      const { data: friendships, error } = await supabase
        .from('friendships' as any)
        .select('*')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        return [];
      }

      if (!friendships || friendships.length === 0) return [];

      // Get friend user IDs
      const friendUserIds = (friendships as any[]).map((friendship: any) => 
        friendship.user_id === session.user.id 
          ? friendship.friend_id 
          : friendship.user_id
      );

      // Get users data
      const { data: users } = await supabase.auth.admin.listUsers();
      const friendUsers = users?.users.filter(u => friendUserIds.includes(u.id)) || [];

      // Combine friendship data with user data
      return (friendships as any[]).map((friendship: any) => {
        const friendUserId = friendship.user_id === session.user.id 
          ? friendship.friend_id 
          : friendship.user_id;
        
        const friendUser = friendUsers.find(u => u.id === friendUserId);
        
        return {
          id: friendship.id,
          friendship_id: friendship.id,
          user_id: friendUserId,
          display_name: friendUser?.user_metadata?.display_name || friendUser?.email || 'Unknown',
          email: friendUser?.email || '',
          avatar_url: friendUser?.user_metadata?.avatar_url || null,
          created_at: friendship.created_at
        };
      }).filter(f => f.user_id);
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  }

  // Get pending friend requests (received)
  static async getFriendRequests() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get pending requests where current user is the friend (receiver)
      const { data: requests, error } = await supabase
        .from('friendships' as any)
        .select('*')
        .eq('friend_id', session.user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching friend requests:', error);
        return [];
      }

      if (!requests || requests.length === 0) return [];

      // Get sender user IDs
      const senderIds = (requests as any[]).map((r: any) => r.user_id);
      
      // Get users data
      const { data: users } = await supabase.auth.admin.listUsers();
      const senderUsers = users?.users.filter(u => senderIds.includes(u.id)) || [];

      // Combine request data with sender data
      return (requests as any[]).map((request: any) => {
        const senderUser = senderUsers.find(u => u.id === request.user_id);
        return {
          id: request.id,
          user_id: request.user_id,
          display_name: senderUser?.user_metadata?.display_name || senderUser?.email || 'Unknown',
          email: senderUser?.email || '',
          avatar_url: senderUser?.user_metadata?.avatar_url || null,
          created_at: request.created_at
        };
      });
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
  }

  // Get sent friend requests (pending)
  static async getSentFriendRequests() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get pending requests where current user is the sender
      const { data: requests, error } = await supabase
        .from('friendships' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching sent friend requests:', error);
        return [];
      }

      return requests || [];
    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
      return [];
    }
  }

  // Send a friend request
  static async sendFriendRequest(friendId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to send friend requests');
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships' as any)
        .select('*')
        .or(`and(user_id.eq.${session.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${session.user.id})`)
        .single();

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
        .single();

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

  // Accept a friend request
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
        .eq('friend_id', session.user.id) // Only the receiver can accept
        .select()
        .single();

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

  // Reject a friend request
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
        .eq('friend_id', session.user.id); // Only the receiver can reject

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

  // Remove a friend
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

  // Cancel a sent friend request
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
        .eq('user_id', session.user.id); // Only the sender can cancel

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

// Profile Service