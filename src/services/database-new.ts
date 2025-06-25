import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export class StudyEventsService {
  static async getEvents() {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        console.error('Error loading events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('StudyEventsService.getEvents error:', error);
      return [];
    }
  }

  static async getEventsByDate(date: string) {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .gte('scheduled_start', `${date}T00:00:00.000Z`)
        .lte('scheduled_start', `${date}T23:59:59.999Z`)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error loading events by date:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('StudyEventsService.getEventsByDate error:', error);
      return [];
    }
  }
}

export class StudyGroupsService {
  static async getGroups() {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading groups:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('StudyGroupsService.getGroups error:', error);
      return [];
    }
  }

  static async getUserGroups() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('No user session for getUserGroups, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          study_groups (
            *
          )
        `)
        .eq('user_id', session.user.id);
      
      if (error) {
        console.error('Error loading user groups:', error);
        return [];
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

  static async joinGroup(groupId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Must be logged in to join a group');
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
      
      if (error) throw error;
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
  static async getAvailableSessions() {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        console.error('Error loading sessions:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('StudySessionsService.getAvailableSessions error:', error);
      return [];
    }
  }
}

export class NotesService {
  static async getUserNotes() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('No user session for getUserNotes, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading user notes:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('NotesService.getUserNotes error:', error);
      return [];
    }
  }

  static async createNote(note: Database['public']['Tables']['notes']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert(note)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('NotesService.createNote error:', error);
      throw error;
    }
  }

  static async updateNote(noteId: string, updates: Database['public']['Tables']['notes']['Update']) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('NotesService.updateNote error:', error);
      throw error;
    }
  }

  static async deleteNote(noteId: string) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
    } catch (error) {
      console.error('NotesService.deleteNote error:', error);
      throw error;
    }
  }
}

export class NotificationsService {
  static async getNotifications() {
    try {
      // Since there's no notifications table, return empty array for now
      console.warn('Notifications table does not exist in Supabase schema, returning empty array');
      return [];
    } catch (error) {
      console.error('NotificationsService.getNotifications error:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      // Since there's no notifications table, just log and return
      console.warn('Notifications table does not exist in Supabase schema');
      return null;
    } catch (error) {
      console.error('NotificationsService.markAsRead error:', error);
      throw error;
    }
  }
}

export class FriendsService {
  static async getFriends() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('No user session for getFriends, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`)
        .eq('status', 'accepted');
      
      if (error) {
        console.error('Error loading friends:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('FriendsService.getFriends error:', error);
      return [];
    }
  }
}

export class ChatService {
  static async getConversations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.warn('No user session for getConversations, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error loading conversations:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('ChatService.getConversations error:', error);
      return [];
    }
  }

  static async getMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading messages:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('ChatService.getMessages error:', error);
      return [];
    }
  }

  static async sendMessage(message: Database['public']['Tables']['messages']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      throw error;
    }
  }
}
