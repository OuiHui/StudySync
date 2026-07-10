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

      // Get profiles data
      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', friendUserIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
      }

      const activeProfiles = friendProfiles || [];

      // Combine friendship data with user data
      return (friendships as any[]).map((friendship: any) => {
        const friendUserId = friendship.user_id === session.user.id 
          ? friendship.friend_id 
          : friendship.user_id;
        
        const profile = activeProfiles.find(p => p.user_id === friendUserId);
        
        return {
          id: friendship.id,
          friendship_id: friendship.id,
          user_id: friendUserId,
          display_name: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown',
          email: profile?.email || '',
          avatar_url: profile?.avatar_url || null,
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
      
      // Get profiles data
      const { data: senderProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
      }

      const activeProfiles = senderProfiles || [];

      // Combine request data with sender data
      return (requests as any[]).map((request: any) => {
        const profile = activeProfiles.find(p => p.user_id === request.user_id);
        return {
          id: request.id,
          user_id: request.user_id,
          display_name: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown',
          email: profile?.email || '',
          avatar_url: profile?.avatar_url || null,
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

  // Get a single user's profile and friendship status
  static async getUserProfile(targetUserId: string, currentUserId: string) {
    try {
      // 1. Get profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // 2. Get friendship status
      const { data: friendship } = await supabase
        .from('friendships' as any)
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      let status: 'none' | 'pending' | 'friends' = 'none';
      if (friendship) {
        if (friendship.status === 'accepted') status = 'friends';
        else if (friendship.status === 'pending') status = 'pending';
      }

      // 3. Get total friends count for target user
      const { count: friendsCount } = await supabase
        .from('friendships' as any)
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`)
        .eq('status', 'accepted');

      // 4. Get public study groups for target user
      const { data: groupMembers, error: groupsError } = await supabase
        .from('group_members' as any)
        .select('group_id, study_groups(name, is_public)')
        .eq('user_id', targetUserId);

      const publicGroups: string[] = [];
      if (!groupsError && groupMembers) {
        groupMembers.forEach((gm: any) => {
          if (gm.study_groups && gm.study_groups.is_public) {
            publicGroups.push(gm.study_groups.name);
          }
        });
      }

      // 5. Get mutual friends count
      const { data: currentUserFriendships } = await supabase
        .from('friendships' as any)
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted');

      const { data: targetUserFriendships } = await supabase
        .from('friendships' as any)
        .select('user_id, friend_id')
        .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`)
        .eq('status', 'accepted');

      const currentUserFriendIds = new Set(
        (currentUserFriendships || []).map((f: any) =>
          f.user_id === currentUserId ? f.friend_id : f.user_id
        )
      );
      const targetUserFriendIds = (targetUserFriendships || []).map((f: any) =>
        f.user_id === targetUserId ? f.friend_id : f.user_id
      );
      const mutualFriendsCount = targetUserFriendIds.filter((id: string) =>
        currentUserFriendIds.has(id)
      ).length;

      const name = profile.display_name || profile.email?.split('@')[0] || 'Unknown';
      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '👤';

      return {
        id: targetUserId,
        name,
        email: profile.email || '',
        avatar: profile.avatar_url || null,
        initials,
        gradientFrom: profile.gradient_from || 'from-blue-400',
        gradientTo: profile.gradient_to || 'to-blue-600',
        major: profile.major || 'Computer Science',
        year: profile.year || '1st Year',
        mutualFriends: mutualFriendsCount,
        studyHours: profile.study_hours || 0,
        status,
        bio: profile.bio || '',
        topSubjects: profile.top_subjects || [],
        friendshipId: friendship?.id,
        friendsCount: friendsCount || 0,
        groupsCount: publicGroups.length,
        publicGroups,
      };
    } catch (err) {
      console.error('Error in getUserProfile:', err);
      return null;
    }
  }
}