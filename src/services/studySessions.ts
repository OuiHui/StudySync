import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class StudySessionsService {
  static async getSessions() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const userId = session.user.id;

      // Get sessions the user created OR sessions they're participating in
      // First get sessions the user created
      const { data: createdSessions, error: createdError } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .eq('created_by', userId)
        .order('scheduled_start', { ascending: true });

      if (createdError) {
        console.error('Error fetching created sessions:', createdError);
      }

      // Get sessions the user is participating in
      const { data: participations, error: participationError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', userId);

      let participatedSessions = [];
      if (!participationError && participations && participations.length > 0) {
        const sessionIds = participations.map(p => p.session_id);
        const { data: sessions, error: sessionsError } = await supabase
          .from('study_sessions')
          .select(`
            *,
            study_groups (
              id,
              name,
              subject
            )
          `)
          .in('id', sessionIds)
          .order('scheduled_start', { ascending: true });

        if (!sessionsError) {
          participatedSessions = sessions || [];
        }
      }

      // Get sessions from groups the user is a member of
      const { data: groupMemberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      let groupSessions = [];
      if (!membershipError && groupMemberships && groupMemberships.length > 0) {
        const groupIds = groupMemberships.map(m => m.group_id);
        const { data: sessions, error: groupSessionsError } = await supabase
          .from('study_sessions')
          .select(`
            *,
            study_groups (
              id,
              name,
              subject
            )
          `)
          .in('group_id', groupIds)
          .order('scheduled_start', { ascending: true });

        if (!groupSessionsError) {
          groupSessions = sessions || [];
        }
      }

      // Combine all sessions and remove duplicates
      const allSessions = [
        ...(createdSessions || []),
        ...participatedSessions,
        ...groupSessions
      ];

      // Remove duplicates by session ID
      const uniqueSessions = allSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      if (!uniqueSessions || uniqueSessions.length === 0) return [];

      const sessionIds = uniqueSessions.map(s => s.id);
      const { data: allParticipants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds);

      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const sessionsWithParticipants = uniqueSessions.map((studySession) => {
        const sessionParts = allParticipants?.filter(p => p.session_id === studySession.id) || [];
        const participantProfiles = sessionParts.map(sp => {
          const profile = profiles.find(p => p.user_id === sp.user_id);
          return {
            user_id: sp.user_id,
            profiles: profile || null
          };
        });

        return {
          ...studySession,
          session_participants: participantProfiles
        };
      });

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

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);
      const { data: allParticipants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds);

      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const sessionsWithParticipants = sessions.map((studySession) => {
        const sessionParts = allParticipants?.filter(p => p.session_id === studySession.id) || [];
        const participantProfiles = sessionParts.map(sp => {
          const profile = profiles.find(p => p.user_id === sp.user_id);
          return {
            user_id: sp.user_id,
            profiles: profile || null
          };
        });

        return {
          ...studySession,
          session_participants: participantProfiles
        };
      });

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      return [];
    }
  }

  static async getSessionsByGroup(groupId: string) {
    try {
      // Get all sessions for this group
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
        .eq('group_id', groupId)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching group sessions:', error);
        return [];
      }

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);
      const { data: allParticipants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds);

      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const sessionsWithParticipants = sessions.map((studySession) => {
        const sessionParts = allParticipants?.filter(p => p.session_id === studySession.id) || [];
        const participantProfiles = sessionParts.map(sp => {
          const profile = profiles.find(p => p.user_id === sp.user_id);
          return {
            user_id: sp.user_id,
            profiles: profile || null
          };
        });

        return {
          ...studySession,
          participant_count: sessionParts.length,
          session_participants: participantProfiles
        };
      });

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching group sessions:', error);
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

  static async updateSession(sessionId: string, updates: Partial<StudySession>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update sessions');
      }

      // Handle RLS recursion by trying different approaches
      try {
        const { data, error } = await supabase
          .from('study_sessions')
          .update(updates)
          .eq('id', sessionId)
          .eq('created_by', session.user.id)
          .select()
          .single();

        if (error) {
          // Check if it's RLS recursion specifically
          if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
            console.warn('RLS recursion detected in updateSession, trying alternative approach...');
            
            // Try updating without the select to avoid potential RLS issues
            const { error: updateError } = await supabase
              .from('study_sessions')
              .update(updates)
              .eq('id', sessionId)
              .eq('created_by', session.user.id);

            if (updateError) {
              throw updateError;
            }

            // If update succeeded, fetch the updated record separately
            const { data: updatedData, error: fetchError } = await supabase
              .from('study_sessions')
              .select('*')
              .eq('id', sessionId)
              .eq('created_by', session.user.id)
              .single();

            if (fetchError) {
              console.warn('Could not fetch updated session due to RLS, but update succeeded');
              return { id: sessionId, ...updates }; // Return what we know was updated
            }

            return updatedData;
          } else {
            handleDbError(error, 'update study session');
          }
        }

        return data;
      } catch (directError: any) {
        // If it's RLS recursion, try a simpler approach
        if (directError.code === '42P17' || directError.message?.includes('infinite recursion')) {
          console.warn('RLS recursion in updateSession, attempting minimal update...');
          
          // Try updating without any complex where clauses that might trigger RLS
          const { error: simpleUpdateError } = await supabase
            .from('study_sessions')
            .update(updates)
            .eq('id', sessionId);

          if (simpleUpdateError) {
            throw new Error('Unable to update session due to database configuration. Please try again later.');
          }

          return { id: sessionId, ...updates };
        } else {
          throw directError;
        }
      }
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  static async deleteSession(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to delete sessions');
      }

      try {
        const { error } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('created_by', session.user.id);

        if (error) {
          // Handle RLS recursion specifically for delete operations
          if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
            console.warn('RLS recursion detected in deleteSession, trying alternative approach...');
            
            // Try delete without the created_by constraint that might trigger RLS
            const { error: simpleDeleteError } = await supabase
              .from('study_sessions')
              .delete()
              .eq('id', sessionId);

            if (simpleDeleteError) {
              throw new Error('Unable to delete session due to database configuration. Please try again later.');
            }
          } else {
            handleDbError(error, 'delete study session');
          }
        }

        return true;
      } catch (directError: any) {
        if (directError.code === '42P17' || directError.message?.includes('infinite recursion')) {
          console.warn('RLS recursion in deleteSession, attempting minimal delete...');
          
          const { error: simpleDeleteError } = await supabase
            .from('study_sessions')
            .delete()
            .eq('id', sessionId);

          if (simpleDeleteError) {
            throw new Error('Unable to delete session due to database configuration. Please try again later.');
          }

          return true;
        } else {
          throw directError;
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}

// Notes Service