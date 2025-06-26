import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Helper function to check authentication
const checkAuth = async () => {
  try {
    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error);
      return null;
    }

    // If no session, return null
    if (!session) {
      return null;
    }

    // Check if the token is expired (with some buffer time)
    const now = Math.floor(Date.now() / 1000);
    const tokenExp = session.expires_at || 0;
    
    // If token is expired or about to expire (within 60 seconds), try to refresh
    if (tokenExp - now < 60) {
      console.log('Token expired or expiring soon, attempting refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        // Clear the session and redirect to login
        await supabase.auth.signOut();
        return null;
      }
      
      if (refreshData?.session) {
        console.log('Session refreshed successfully');
        return refreshData.session;
      }
    }

    return session;
  } catch (error) {
    console.error('Unexpected error in checkAuth:', error);
    return null;
  }
};

// Helper function to handle database errors
const handleDbError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error);
  
  if (error.code === 'PGRST116') {
    throw new Error(`No data found for ${operation}`);
  } else if (error.code === 'PGRST301') {
    // Check if it's a JWT expiration
    if (error.message?.includes('JWT expired') || error.message?.includes('JWT')) {
      throw new Error(`Session expired. Please log in again.`);
    }
    throw new Error(`Authentication required for ${operation}`);
  } else if (error.message?.includes('RLS')) {
    throw new Error(`Access denied for ${operation}. Please ensure you're logged in.`);
  } else if (error.message?.includes('JWT expired')) {
    throw new Error(`Session expired. Please log in again.`);
  } else {
    throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
  }
};

// Type aliases for cleaner code
type StudyGroup = Database['public']['Tables']['study_groups']['Row'];
type StudySession = Database['public']['Tables']['study_sessions']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type User = Database['public']['Tables']['profiles']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];
type SessionParticipant = Database['public']['Tables']['session_participants']['Row'];
type Friendship = Database['public']['Tables']['friendships']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

// Study Events Service (using study_sessions for calendar events)
class StudyEventsService {
  static async getEvents() {
    try {
      // First get the sessions with group info
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .order('scheduled_start', { ascending: true });

      if (error) {
        handleDbError(error, 'fetch study events');
      }

      if (!sessions) return [];

      // Get participants for each session separately
      const sessionsWithParticipants = await Promise.all(
        sessions.map(async (session) => {
          const { data: participants } = await supabase
            .from('session_participants')
            .select('user_id')
            .eq('session_id', session.id);

          // Get profile info for participants
          let participantProfiles = [];
          if (participants && participants.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .in('user_id', participants.map(p => p.user_id));
            
            participantProfiles = profiles || [];
          }

          return {
            ...session,
            session_participants: participantProfiles.map(profile => ({
              user_id: profile.user_id,
              profiles: profile
            }))
          };
        })
      );

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching study events:', error);
      return [];
    }
  }

  static async createEvent(eventData: {
    title: string;
    scheduled_start: string;
    scheduled_end: string;
    description?: string;
    group_id?: string;
  }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create events');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          ...eventData,
          created_by: session.user.id,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'create study event');
      }

      return data;
    } catch (error) {
      console.error('Error creating study event:', error);
      throw error;
    }
  }

  static async updateEvent(id: string, updates: Partial<StudySession>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update events');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .eq('created_by', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update study event');
      }

      return data;
    } catch (error) {
      console.error('Error updating study event:', error);
      throw error;
    }
  }

  static async deleteEvent(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to delete events');
      }

      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', id)
        .eq('created_by', session.user.id);

      if (error) {
        handleDbError(error, 'delete study event');
      }

      return true;
    } catch (error) {
      console.error('Error deleting study event:', error);
      throw error;
    }
  }
}

// Study Groups Service
class StudyGroupsService {
  static async getUserGroups() {
    try {
      const session = await checkAuth();
      if (!session) {
        console.log('No session found, returning empty groups');
        return [];
      }

      const userId = session.user.id;
      console.log('Fetching user groups for user:', userId);

      // Check if this is an anonymous user
      const isAnonymous = !session.user.email || 
                         session.user.is_anonymous === true ||
                         session.user.aud === 'anonymous';
      
      if (isAnonymous) {
        console.log('Anonymous user detected, returning empty groups');
        return [];
      }

      // TEMPORARY WORKAROUND: Skip group_members query due to RLS recursion
      // Instead, try to get groups created by the user directly
      console.log('Using temporary workaround - fetching groups created by user only');
      
      try {
        const { data: createdGroups, error: createdError } = await supabase
          .from('study_groups')
          .select('*')
          .eq('created_by', userId);

        if (createdError) {
          console.error('Error fetching user-created groups:', createdError);
          return [];
        }

        if (!createdGroups || createdGroups.length === 0) {
          console.log('No groups created by user found');
          return [];
        }

        // Transform to match expected format
        const groupsWithDetails = createdGroups.map(group => ({
          ...group,
          creator_profile: null, // We could fetch this separately if needed
          user_role: 'admin', // User created the group, so they're admin
          joined_at: group.created_at
        }));

        console.log('Successfully fetched user-created groups:', groupsWithDetails.length);
        return groupsWithDetails;
        
      } catch (directError) {
        console.error('Error with direct group fetch:', directError);
        return [];
      }

    } catch (error) {
      console.error('Unexpected error fetching user groups:', error);
      return [];
    }
  }

  // DISABLED: This method causes RLS recursion - re-enable when policies are fixed
  static async getUserGroupsViaMembers() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const userId = session.user.id;

      // This query causes RLS recursion - commenting out for now
      /*
      const { data: memberships, error } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching memberships:', error);
        return [];
      }

      // Get group details...
      */
      
      console.log('getUserGroupsViaMembers is disabled due to RLS recursion');
      return [];
      
    } catch (error) {
      console.error('Error in getUserGroupsViaMembers:', error);
      return [];
    }
  }

  static async getPublicGroups() {
    try {
      // Get public groups first (without the problematic join)
      const { data: groups, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public groups:', error);
        return [];
      }

      if (!groups) return [];

      // Get creator profiles and member counts for each group separately
      const groupsWithCreators = await Promise.all(
        groups.map(async (group) => {
          // Get creator profile
          const { data: creator } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('user_id', group.created_by)
            .single();

          // Get member count separately to avoid RLS recursion
          let memberCount = 0;
          try {
            const { count, error: countError } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);
              
            if (countError) {
              console.warn(`Error fetching member count for group ${group.id}:`, {
                code: countError.code,
                message: countError.message
              });
              
              // Handle RLS recursion or permission errors gracefully
              if (countError.code === '42P17' || countError.message?.includes('infinite recursion') ||
                  countError.code === '42501' || countError.message?.includes('permission denied')) {
                memberCount = 0; // Default to 0 if we can't fetch due to RLS
              } else {
                memberCount = 0; // Default to 0 for any other error
              }
            } else {
              memberCount = count || 0;
            }
          } catch (memberCountError) {
            console.warn('Exception fetching member count for group', group.id, memberCountError);
            // If we can't get member count due to RLS issues, default to 0
            memberCount = 0;
          }

          return {
            ...group,
            creator_profile: creator,
            member_count: memberCount
          };
        })
      );

      return groupsWithCreators;
    } catch (error) {
      console.error('Error fetching public groups:', error);
      return [];
    }
  }

  static async getGroupById(id: string) {
    try {
      // Get group info first
      const { data: group, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleDbError(error, 'fetch group details');
      }

      if (!group) return null;

      // Get creator profile
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('user_id', group.created_by)
        .single();

      // Get group members with their profiles
      let membersWithProfiles = [];
      try {
        const { data: members } = await supabase
          .from('group_members')
          .select('id, user_id, role, joined_at')
          .eq('group_id', id);

        if (members && members.length > 0) {
          const { data: memberProfiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, user_id')
            .in('user_id', members.map(m => m.user_id));

          membersWithProfiles = members.map(member => ({
            ...member,
            profile: memberProfiles?.find(p => p.user_id === member.user_id)
          }));
        }
      } catch (membersError) {
        console.warn('Could not fetch group members due to RLS policy:', membersError);
        // If we can't get members due to RLS issues, return empty array
        membersWithProfiles = [];
      }

      return {
        ...group,
        creator_profile: creator,
        group_members: membersWithProfiles
      };
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  static async createGroup(groupData: {
    name: string;
    description?: string;
    subject?: string;
    is_public: boolean;
    max_members?: number;
  }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create groups');
      }

      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          ...groupData,
          created_by: session.user.id
        })
        .select()
        .single();

      if (groupError) {
        handleDbError(groupError, 'create study group');
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session.user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('Error adding creator to group:', memberError);
      }

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  static async joinGroup(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to join groups');
      }

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: session.user.id,
          role: 'member'
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'join group');
      }

      return data;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  static async leaveGroup(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to leave groups');
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', session.user.id);

      if (error) {
        handleDbError(error, 'leave group');
      }

      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  static async updateGroup(id: string, updates: Partial<StudyGroup>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update groups');
      }

      const { data, error } = await supabase
        .from('study_groups')
        .update(updates)
        .eq('id', id)
        .eq('created_by', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update group');
      }

      return data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  static async deleteGroup(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to delete groups');
      }

      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', id)
        .eq('created_by', session.user.id);

      if (error) {
        handleDbError(error, 'delete group');
      }

      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }
}

// Study Sessions Service
class StudySessionsService {
  static async getSessions() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // First get sessions with group info
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .or(`created_by.eq.${session.user.id}`)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      if (!sessions) return [];

      // Get participants for each session separately
      const sessionsWithParticipants = await Promise.all(
        sessions.map(async (studySession) => {
          const { data: participants } = await supabase
            .from('session_participants')
            .select('user_id')
            .eq('session_id', studySession.id);

          // Get profile info for participants
          let participantProfiles = [];
          if (participants && participants.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, user_id')
              .in('user_id', participants.map(p => p.user_id));
            
            participantProfiles = profiles || [];
          }

          return {
            ...studySession,
            session_participants: participantProfiles.map(profile => ({
              user_id: profile.user_id,
              profiles: profile
            }))
          };
        })
      );

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  static async getAvailableSessions() {
    try {
      const now = new Date().toISOString();
      
      // First get available sessions with group info
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .gte('scheduled_start', now)
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching available sessions:', error);
        return [];
      }

      if (!sessions) return [];

      // Get participants for each session separately
      const sessionsWithParticipants = await Promise.all(
        sessions.map(async (studySession) => {
          const { data: participants } = await supabase
            .from('session_participants')
            .select('user_id')
            .eq('session_id', studySession.id);

          // Get profile info for participants
          let participantProfiles = [];
          if (participants && participants.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, user_id')
              .in('user_id', participants.map(p => p.user_id));
            
            participantProfiles = profiles || [];
          }

          return {
            ...studySession,
            session_participants: participantProfiles.map(profile => ({
              user_id: profile.user_id,
              profiles: profile
            }))
          };
        })
      );

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      return [];
    }
  }

  static async createSession(sessionData: {
    title: string;
    description?: string;
    scheduled_start: string;
    scheduled_end: string;
    group_id?: string;
    max_participants?: number;
  }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create sessions');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          ...sessionData,
          created_by: session.user.id,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'create study session');
      }

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  static async joinSession(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to join sessions');
      }

      const { data, error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'join session');
      }

      return data;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  static async leaveSession(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to leave sessions');
      }

      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', session.user.id);

      if (error) {
        handleDbError(error, 'leave session');
      }

      return true;
    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  }

  static async updateSessionStatus(sessionId: string, status: 'scheduled' | 'active' | 'completed' | 'cancelled') {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update sessions');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .update({ status })
        .eq('id', sessionId)
        .eq('created_by', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update session status');
      }

      return data;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }
}

// Notes Service
class NotesService {
  static async getNotes() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('created_by', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  static async createNote(noteData: {
    title: string;
    content?: string;
    subject?: string;
    permission_level?: 'private' | 'friends' | 'group' | 'public';
  }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create notes');
      }

      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'create note');
      }

      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  static async updateNote(id: string, updates: Partial<Note>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update notes');
      }

      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('created_by', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update note');
      }

      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  static async deleteNote(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to delete notes');
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('created_by', session.user.id);

      if (error) {
        handleDbError(error, 'delete note');
      }

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
}

// Notifications Service (using messages for notifications since there's no notifications table)
class NotificationsService {
  static async getUserNotifications() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // For now, return empty array since we don't have a notifications table
      // In a real implementation, you might use messages or create a notifications table
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      // Since there's no notifications table, just return success
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead() {
    try {
      // Since there's no notifications table, just return success
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

// Friends Service
class FriendsService {
  static async getUserFriends() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        return [];
      }

      if (!friendships || friendships.length === 0) return [];

      // Get friend user IDs
      const friendUserIds = friendships.map(friendship => 
        friendship.requester_id === session.user.id 
          ? friendship.addressee_id 
          : friendship.requester_id
      );

      // Get friend profiles
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', friendUserIds);

      // Combine friendship data with profiles
      return friendships.map(friendship => {
        const friendUserId = friendship.requester_id === session.user.id 
          ? friendship.addressee_id 
          : friendship.requester_id;
        
        const friendProfile = friendProfiles?.find(p => p.user_id === friendUserId);
        
        return {
          ...friendship,
          friend: friendProfile
        };
      }).filter(f => f.friend);
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  }

  static async getFriendRequests() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get pending friend requests where current user is the addressee
      const { data: requests, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', session.user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching friend requests:', error);
        return [];
      }

      if (!requests || requests.length === 0) return [];

      // Get requester profiles
      const requesterIds = requests.map(r => r.requester_id);
      const { data: requesterProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', requesterIds);

      // Combine request data with requester profiles
      return requests.map(request => ({
        ...request,
        requester: requesterProfiles?.find(p => p.user_id === request.requester_id)
      })).filter(r => r.requester);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
  }

  static async sendFriendRequest(userId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to send friend requests');
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: session.user.id,
          addressee_id: userId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'send friend request');
      }

      return data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  static async acceptFriendRequest(friendshipId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to accept friend requests');
      }

      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .eq('addressee_id', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'accept friend request');
      }

      return data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  static async removeFriend(friendshipId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to remove friends');
      }

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`);

      if (error) {
        handleDbError(error, 'remove friend');
      }

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
}

// Profile Service
class ProfileService {
  static async getCurrentUser() {
    try {
      const session = await checkAuth();
      if (!session) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching current user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  static async updateProfile(updates: Partial<User>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update profile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update profile');
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

// Chat Service
class ChatService {
  static async getConversations() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get user's conversation participations
      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          conversations (*)
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      if (!participations) return [];

      // Get latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        participations.map(async (participation) => {
          const conversation = participation.conversations;
          if (!conversation) return null;

          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get sender profile if message exists
          let senderProfile = null;
          if (latestMessage) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('user_id', latestMessage.sender_id)
              .single();
            senderProfile = sender;
          }

          return {
            ...participation,
            conversations: {
              ...conversation,
              latest_message: latestMessage ? {
                ...latestMessage,
                sender: senderProfile
              } : null
            }
          };
        })
      );

      return conversationsWithMessages.filter(Boolean);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  static async getMessages(conversationId: string) {
    try {
      // Get messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      if (!messages || messages.length === 0) return [];

      // Get sender profiles for all messages
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', senderIds);

      // Combine messages with sender profiles
      return messages.map(message => ({
        ...message,
        sender: senderProfiles?.find(p => p.user_id === message.sender_id)
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  static async sendMessage(conversationId: string, content: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to send messages');
      }

      // Insert the message first
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content
        })
        .select('*')
        .single();

      if (error) {
        handleDbError(error, 'send message');
      }

      // Get sender profile separately
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('user_id', session.user.id)
        .single();

      return {
        ...message,
        sender: senderProfile
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async createConversation(userId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create conversations');
      }

      // First create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          created_by: session.user.id,
          is_group_chat: false
        })
        .select()
        .single();

      if (convError) {
        handleDbError(convError, 'create conversation');
      }

      // Add both users as participants
      const participants = [
        { conversation_id: conversation.id, user_id: session.user.id },
        { conversation_id: conversation.id, user_id: userId }
      ];

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) {
        console.error('Error adding conversation participants:', participantError);
      }

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }
}

// Utility function to test RLS policies (for debugging)
const testRLSPolicies = async () => {
  const session = await checkAuth();
  if (!session) {
    console.log('❌ No authenticated session');
    return;
  }

  console.log('🔍 Testing RLS policies...');
  console.log('👤 User ID:', session.user.id);
  
  // Test study_groups access
  try {
    const { data: groups, error: groupsError } = await supabase
      .from('study_groups')
      .select('id, name, created_by, is_public')
      .limit(5);
    
    console.log(groupsError ? '❌ study_groups error:' : '✅ study_groups access:', 
                groupsError || `${groups?.length || 0} groups found`);
  } catch (e) {
    console.log('❌ study_groups exception:', e);
  }

  // Test group_members access (this will likely fail due to RLS recursion)
  try {
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id, group_id, user_id, role')
      .limit(5);
    
    console.log(membersError ? '❌ group_members error:' : '✅ group_members access:', 
                membersError || `${members?.length || 0} memberships found`);
  } catch (e) {
    console.log('❌ group_members exception:', e);
  }

  // Test profiles access
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, user_id')
      .eq('user_id', session.user.id)
      .single();
    
    console.log(profileError ? '❌ profiles error:' : '✅ profiles access:', 
                profileError || 'Profile found');
  } catch (e) {
    console.log('❌ profiles exception:', e);
  }
};

// Export all services
export {
  StudyEventsService,
  StudyGroupsService,
  StudySessionsService,
  NotesService,
  NotificationsService,
  FriendsService,
  ProfileService,
  ChatService,
  testRLSPolicies
};
