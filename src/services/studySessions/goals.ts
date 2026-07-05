import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

export interface SessionGoal {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  progress: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export class SessionGoalsService {
  static async getSessionGoals(sessionId: string): Promise<SessionGoal[]> {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('session_goals')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        handleDbError(error, 'fetch session goals');
      }

      return (data || []) as SessionGoal[];
    } catch (error) {
      console.error('Error fetching session goals:', error);
      return [];
    }
  }

  static async createGoal(goalData: {
    session_id: string;
    title: string;
    description?: string;
  }): Promise<SessionGoal | null> {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('session_goals')
        .insert({
          session_id: goalData.session_id,
          title: goalData.title,
          description: goalData.description || null,
          progress: 0,
          completed: false
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'create session goal');
      }

      return data as SessionGoal;
    } catch (error) {
      console.error('Error creating session goal:', error);
      throw error;
    }
  }

  static async updateGoal(
    goalId: string,
    updates: Partial<{
      title: string;
      description: string | null;
      progress: number;
      completed: boolean;
    }>
  ): Promise<SessionGoal | null> {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('session_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update session goal');
      }

      return data as SessionGoal;
    } catch (error) {
      console.error('Error updating session goal:', error);
      throw error;
    }
  }

  static async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('session_goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        handleDbError(error, 'delete session goal');
      }

      return true;
    } catch (error) {
      console.error('Error deleting session goal:', error);
      throw error;
    }
  }
}
