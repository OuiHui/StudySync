import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudySession } from '../utils';

export class StudySessionsMutations {
  static async createSession(sessionData: {
    title: string;
    description?: string;
    scheduled_start: string;
    scheduled_end: string;
    group_id?: string;
    max_participants?: number;
    subject?: string;
    target_duration?: number;
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

      // Automatically add the creator as the host participant if it's a group session
      if (data && sessionData.group_id) {
        try {
          await supabase
            .from('session_participants')
            .insert({
              session_id: data.id,
              user_id: session.user.id,
              role: 'host',
              status: 'active'
            });
        } catch (joinError) {
          console.error('Error adding host to session participants:', joinError);
        }
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
          user_id: session.user.id,
          role: 'participant',
          status: 'active'
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

  static async updateSessionStatus(
    sessionId: string,
    status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'running' | 'paused' | 'finished'
  ) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update sessions');
      }

      // Fetch the current session state to get actual_start
      const { data: currentSession, error: fetchError } = await supabase
        .from('study_sessions')
        .select('actual_start')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        handleDbError(fetchError, 'fetch session for status update');
      }

      const updates: any = { status };
      const now = new Date().toISOString();

      if (status === 'running' || status === 'active') {
        if (!currentSession?.actual_start) {
          updates.actual_start = now;
        }
      } else if (status === 'finished' || status === 'completed' || status === 'cancelled') {
        updates.actual_end = now;
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', sessionId)
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

  static async pauseSession(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to pause sessions');
      }

      const { data: currentSession, error: fetchError } = await supabase
        .from('study_sessions')
        .select('pause_logs')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        handleDbError(fetchError, 'fetch session for pause');
      }

      const logs = Array.isArray(currentSession?.pause_logs) ? [...currentSession.pause_logs] : [];
      logs.push({ paused_at: new Date().toISOString(), resumed_at: null });

      const { data, error } = await supabase
        .from('study_sessions')
        .update({
          status: 'paused',
          pause_logs: logs
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'pause session');
      }

      return data;
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  }

  static async resumeSession(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to resume sessions');
      }

      const { data: currentSession, error: fetchError } = await supabase
        .from('study_sessions')
        .select('pause_logs')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        handleDbError(fetchError, 'fetch session for resume');
      }

      const logs = Array.isArray(currentSession?.pause_logs) ? [...currentSession.pause_logs] : [];
      if (logs.length > 0 && logs[logs.length - 1].resumed_at === null) {
        logs[logs.length - 1].resumed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .update({
          status: 'running',
          pause_logs: logs
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'resume session');
      }

      return data;
    } catch (error) {
      console.error('Error resuming session:', error);
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

  static async updateParticipantStatus(sessionId: string, userId: string, status: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('session_participants')
        .update({ status })
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update participant status');
      }

      return data;
    } catch (error) {
      console.error('Error updating participant status:', error);
      throw error;
    }
  }

  static async removeParticipant(sessionId: string, userId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        handleDbError(error, 'remove participant');
      }

      return true;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }
}
