import { supabase } from '@/integrations/supabase/client';
import { checkAuth } from '../utils';

export class FriendsQueries {
  static async searchUsers(searchTerm: string) {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data, error } = await supabase.rpc('search_users', {
        _search_term: searchTerm
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

  static async getUserFriends() {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
        .eq('status', 'accepted');

      if (error || !friendships || friendships.length === 0) {
        if (error) console.error('Error fetching friends:', error);
        return [];
      }

      const friendUserIds = friendships.map(friendship => 
        friendship.user_id === session.user.id 
          ? friendship.friend_id 
          : friendship.user_id
      );

      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', friendUserIds);

      if (profilesError) console.error('Error fetching friend profiles:', profilesError);

      const activeProfiles = friendProfiles || [];

      return friendships.map(friendship => {
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

  static async getMutualFriends(targetUserId: string) {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data, error } = await supabase.rpc('get_mutual_friends', {
        _user_id1: targetUserId,
        _user_id2: session.user.id
      });

      if (error) {
        console.error('Error fetching mutual friends:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching mutual friends:', error);
      return [];
    }
  }

  static async getFriendRequests() {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data: requests, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', session.user.id)
        .eq('status', 'pending');

      if (error || !requests || requests.length === 0) {
        if (error) console.error('Error fetching friend requests:', error);
        return [];
      }

      const senderIds = requests.map(r => r.user_id);
      
      const { data: senderProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      if (profilesError) console.error('Error fetching sender profiles:', profilesError);

      const activeProfiles = senderProfiles || [];

      return requests.map(request => {
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

  static async getSentFriendRequests() {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data: requests, error } = await supabase
        .from('friendships')
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

  static async getUserProfile(targetUserId: string, currentUserId: string) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      let status: 'none' | 'pending' | 'friends' = 'none';
      if (friendship) {
        if (friendship.status === 'accepted') status = 'friends';
        else if (friendship.status === 'pending') status = 'pending';
      }

      const { data: friendsList, error: countError } = await supabase.rpc('get_user_friends', {
        _user_id: targetUserId,
      });
      const friendsCount = !countError && Array.isArray(friendsList) ? friendsList.length : 0;

      const { data: groupMembers, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id, study_groups(id, name, is_public)')
        .eq('user_id', targetUserId);

      const publicGroups: { id: string; name: string }[] = [];
      if (!groupsError && groupMembers) {
        groupMembers.forEach((gm: { group_id: string; study_groups: { id: string; name: string; is_public: boolean | null } | null }) => {
          if (gm.study_groups) {
            publicGroups.push({
              id: gm.group_id || gm.study_groups.id,
              name: gm.study_groups.name,
            });
          }
        });
      }

      const { data: mutualFriendsList, error: mutualError } = await supabase.rpc('get_mutual_friends', {
        _user_id1: targetUserId,
        _user_id2: currentUserId,
      });
      const mutualFriendsCount = !mutualError && Array.isArray(mutualFriendsList) ? mutualFriendsList.length : 0;

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
