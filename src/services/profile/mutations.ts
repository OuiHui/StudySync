import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

export class ProfileMutations {
  static async updateProfile(updates: any) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update profile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', session.user.id)
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
