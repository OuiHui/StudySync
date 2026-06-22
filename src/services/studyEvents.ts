import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class StudyEventsService {
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

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);
      const { data: participants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds);

      const userIds = [...new Set(participants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const sessionsWithParticipants = sessions.map((session) => {
        const sessionParts = participants?.filter(p => p.session_id === session.id) || [];
        const participantProfiles = sessionParts.map(sp => {
          const profile = profiles.find(p => p.user_id === sp.user_id);
          return {
            user_id: sp.user_id,
            profiles: profile || null
          };
        });

        return {
          ...session,
          session_participants: participantProfiles
        };
      });

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

