import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Helper function to check authentication
const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Auth check error:', error);
    return null;
  }
  return session;
};

// Helper function to handle database errors
const handleDbError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error);
  
  if (error.code === 'PGRST116') {
    throw new Error(`No data found for ${operation}`);
  } else if (error.code === 'PGRST301') {
    throw new Error(`Authentication required for ${operation}`);
  } else if (error.message?.includes('RLS')) {
    throw new Error(`Access denied for ${operation}. Please ensure you're logged in.`);
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
      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          ),
          session_participants (
            user_id,
            profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .order('start_time', { ascending: true });

      if (error) {
        handleDbError(error, 'fetch study events');
      }

      return data || [];
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
        return [];
      }

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          study_groups (
            *,
            profiles!study_groups_created_by_fkey (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching user groups:', error);
        return [];
      }

      return data?.map(item => item.study_groups).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  }

  static async getPublicGroups() {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          profiles!study_groups_created_by_fkey (
            id,
            display_name,
            avatar_url
          ),
          group_members (
            id
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public groups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching public groups:', error);
      return [];
    }
  }

  static async getGroupById(id: string) {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          profiles!study_groups_created_by_fkey (
            id,
            display_name,
            avatar_url
          ),
          group_members (
            id,
            user_id,
            role,
            joined_at,
            profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        handleDbError(error, 'fetch group details');
      }

      return data;
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

      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          ),
          session_participants (
            user_id,
            profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .or(`created_by.eq.${session.user.id},session_participants.user_id.eq.${session.user.id}`)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  static async getAvailableSessions() {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          ),
          session_participants (
            user_id,
            profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .gte('scheduled_start', now)
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching available sessions:', error);
        return [];
      }

      return data || [];
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

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey (
            id,
            display_name,
            avatar_url
          ),
          addressee:profiles!friendships_addressee_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        return [];
      }

      // Transform the data to show the friend (not the current user)
      return data?.map(friendship => {
        const friend = friendship.requester_id === session.user.id 
          ? friendship.addressee 
          : friendship.requester;
        return {
          ...friendship,
          friend
        };
      }) || [];
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

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('addressee_id', session.user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching friend requests:', error);
        return [];
      }

      return data || [];
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

      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          conversations (
            *,
            messages (
              id,
              content,
              created_at,
              sender:profiles!messages_sender_id_fkey (
                id,
                display_name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  static async getMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
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

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        handleDbError(error, 'send message');
      }

      return data;
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

// Export all services
export {
  StudyEventsService,
  StudyGroupsService,
  StudySessionsService,
  NotesService,
  NotificationsService,
  FriendsService,
  ProfileService,
  ChatService
};
