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
  
  // Check for common Supabase errors
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

// Helper function to allow temporary anonymous access for development
const tryWithFallback = async (authenticatedOperation: () => Promise<any>, fallbackOperation?: () => Promise<any>) => {
  const session = await checkAuth();
  
  if (session) {
    // User is authenticated, try the normal operation
    return await authenticatedOperation();
  } else {
    // No authentication, try the fallback or return empty array
    console.warn('No authentication session, attempting fallback access');
    if (fallbackOperation) {
      return await fallbackOperation();
    } else {
      return [];
    }
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

// Since there's no study_events table, we'll use study_sessions for calendar events
export class StudyEventsService {
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
          )
        `)
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        console.error('Error loading events:', error);
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.warn('Authentication required for events, returning empty array');
          return [];
        }
        throw new Error(`Failed to load events: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('StudyEventsService.getEvents error:', error);
      return [];
    }
  }

  static async getEventsByDate(date: string) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .gte('scheduled_start', startOfDay.toISOString())
        .lte('scheduled_start', endOfDay.toISOString())
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        console.error('Error loading events by date:', error);
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.warn('Authentication required for events by date, returning empty array');
          return [];
        }
        throw new Error(`Failed to load events by date: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('StudyEventsService.getEventsByDate error:', error);
      return [];
    }
  }

  static async createEvent(session: Database['public']['Tables']['study_sessions']['Insert']) {
    try {
      const authSession = await checkAuth();
      if (!authSession) {
        throw new Error('Authentication required to create events');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          ...session,
          creator_id: authSession.user.id
        })
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .single();
      
      if (error) {
        handleDbError(error, 'create event');
      }
      return data;
    } catch (error) {
      console.error('StudyEventsService.createEvent error:', error);
      throw error;
    }
  }

  static async updateEvent(id: string, updates: Database['public']['Tables']['study_sessions']['Update']) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update events');
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .single();
      
      if (error) {
        handleDbError(error, 'update event');
      }
      return data;
    } catch (error) {
      console.error('StudyEventsService.updateEvent error:', error);
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
        .eq('id', id);
      
      if (error) {
        handleDbError(error, 'delete event');
      }
    } catch (error) {
      console.error('StudyEventsService.deleteEvent error:', error);
      throw error;
    }
  }
}

export class StudyGroupsService {
  static async getUserGroups(userId?: string) {
    try {
      const session = await checkAuth();
      if (!session && !userId) {
        console.warn('No active session and no userId provided for getUserGroups, returning empty array');
        return [];
      }

      const targetUserId = userId || session?.user.id;
      if (!targetUserId) {
        return [];
      }

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject,
            description,
            created_by,
            is_public,
            max_members,
            created_at
          )
        `)
        .eq('user_id', targetUserId);
      
      if (error) {
        console.error('Error loading user groups:', error);
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.warn('Authentication required for user groups, returning empty array');
          return [];
        }
        throw new Error(`Failed to load user groups: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('StudyGroupsService.getUserGroups error:', error);
      return [];
    }
  }

  static async getPublicGroups() {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          group_members (
            id,
            user_id,
            role
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading public groups:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('StudyGroupsService.getPublicGroups error:', error);
      return [];
    }
  }

  static async getGroupById(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to view group details');
      }

      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
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
        .eq('id', groupId)
        .single();
      
      if (error) {
        handleDbError(error, 'load group details');
      }
      return data;
    } catch (error) {
      console.error('StudyGroupsService.getGroupById error:', error);
      throw error;
    }
  }

  static async createGroup(group: Database['public']['Tables']['study_groups']['Insert']) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create groups');
      }

      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          ...group,
          created_by: session.user.id
        })
        .select()
        .single();
      
      if (error) {
        handleDbError(error, 'create group');
      }

      // Auto-join the creator as admin
      if (data) {
        await this.joinGroup(data.id, session.user.id, 'admin');
      }

      return data;
    } catch (error) {
      console.error('StudyGroupsService.createGroup error:', error);
      throw error;
    }
  }

  static async updateGroup(groupId: string, updates: Database['public']['Tables']['study_groups']['Update']) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update groups');
      }

      const { data, error } = await supabase
        .from('study_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();
      
      if (error) {
        handleDbError(error, 'update group');
      }
      return data;
    } catch (error) {
      console.error('StudyGroupsService.updateGroup error:', error);
      throw error;
    }
  }

  static async deleteGroup(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to delete groups');
      }

      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) {
        handleDbError(error, 'delete group');
      }
    } catch (error) {
      console.error('StudyGroupsService.deleteGroup error:', error);
      throw error;
    }
  }

  static async joinGroup(groupId: string, userId?: string, role: 'admin' | 'moderator' | 'member' = 'member') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required to join groups');
      }

      const targetUserId = userId || session.user.id;

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: targetUserId,
          role
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to join group: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('StudyGroupsService.joinGroup error:', error);
      throw error;
    }
  }

  static async leaveGroup(groupId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Must be logged in to leave a group');
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('StudyGroupsService.leaveGroup error:', error);
      throw error;
    }
  }
}

export class StudySessionsService {
  static async getUserSessions(userId?: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        console.warn('No active session for getUserSessions, returning empty array');
        return [];
      }

      const targetUserId = userId || session.user.id;

      const { data, error } = await supabase
        .from('session_participants')
        .select(`
          *,
          study_sessions (
            *,
            study_groups (
              name,
              subject
            )
          )
        `)
        .eq('user_id', targetUserId);
      
      if (error) {
        handleDbError(error, 'load user sessions');
      }
      return data || [];
    } catch (error) {
      console.error('StudySessionsService.getUserSessions error:', error);
      return [];
    }
  }

  static async getAvailableSessions() {
    try {
      const session = await checkAuth();
      if (!session) {
        console.warn('No active session for getAvailableSessions, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            name,
            subject
          ),
          session_participants (
            id,
            user_id
          )
        `)
        .eq('status', 'scheduled')
        .eq('is_public', true)
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        handleDbError(error, 'load available sessions');
      }
      return data || [];
    } catch (error) {
      console.error('StudySessionsService.getAvailableSessions error:', error);
      return [];
    }
  }

  static async getSessionById(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to view session details');
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
            id,
            user_id,
            joined_at,
            profiles (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', sessionId)
        .single();
      
      if (error) {
        handleDbError(error, 'load session details');
      }
      return data;
    } catch (error) {
      console.error('StudySessionsService.getSessionById error:', error);
      throw error;
    }
  }

  static async createSession(session: Database['public']['Tables']['study_sessions']['Insert']) {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async joinSession(sessionId: string, userId: string) {
    const { data, error } = await supabase
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        is_attending: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async leaveSession(sessionId: string, userId: string) {
    const { error } = await supabase
      .from('session_participants')
      .update({ 
        is_attending: false, 
        left_at: new Date().toISOString() 
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
}

export class NotesService {
  static async getUserNotes(userId?: string) {
    try {
      const session = await checkAuth();
      if (!session && !userId) {
        console.warn('No active session and no userId provided for getUserNotes, returning empty array');
        return [];
      }

      const targetUserId = userId || session?.user.id;
      if (!targetUserId) {
        return [];
      }

      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          study_groups (
            name
          ),
          study_sessions (
            title
          )
        `)
        .eq('created_by', targetUserId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error loading user notes:', error);
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.warn('Authentication required for user notes, returning empty array');
          return [];
        }
        throw new Error(`Failed to load user notes: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('NotesService.getUserNotes error:', error);
      return [];
    }
  }

  static async getGroupNotes(groupId: string) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error loading group notes:', error);
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.warn('Authentication required for group notes, returning empty array');
          return [];
        }
        throw new Error(`Failed to load group notes: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('NotesService.getGroupNotes error:', error);
      return [];
    }
  }

  static async createNote(note: Database['public']['Tables']['notes']['Insert']) {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateNote(noteId: string, updates: Database['public']['Tables']['notes']['Update']) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
    
    if (error) throw error;
  }
}

// Since there's no notifications table, we'll use messages for notifications
export class NotificationsService {
  static async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        conversations (
          name,
          is_group_chat
        )
      `)
      .neq('sender_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async markAsRead(messageId: string) {
    // Since there's no read status in messages, we'll just return success
    // In a real implementation, you might want to add a read_receipts table
    return { success: true };
  }

  static async markAllAsRead(userId: string) {
    // Since there's no read status in messages, we'll just return success
    return { success: true };
  }

  static async createNotification(message: Database['public']['Tables']['messages']['Insert']) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export class FriendsService {
  static async getUserFriends(userId: string) {
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
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    return data || [];
  }

  static async getFriendRequests(userId: string) {
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
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    return data || [];
  }

  static async sendFriendRequest(fromUserId: string, toUserId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: fromUserId,
        addressee_id: toUserId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async acceptFriendRequest(requestId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async rejectFriendRequest(requestId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async unfriend(friendshipId: string) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    
    if (error) throw error;
  }
}

export class ProfileService {
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProfile(userId: string, updates: Database['public']['Tables']['profiles']['Update']) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .ilike('display_name', `%${query}%`)
      .limit(10);
    
    if (error) throw error;
    return data || [];
  }
}

export class ChatService {
  static async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        *,
        conversations (
          *,
          messages (
            content,
            created_at,
            sender_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  }

  static async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async sendMessage(message: Database['public']['Tables']['messages']['Insert']) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createConversation(conversation: Database['public']['Tables']['conversations']['Insert']) {
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Export all services as a default object for namespace imports
export default {
  StudyEventsService,
  StudyGroupsService,
  StudySessionsService,
  NotesService,
  NotificationsService,
  FriendsService,
  ProfileService,
  ChatService
};

// Also export individual services for direct imports
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
