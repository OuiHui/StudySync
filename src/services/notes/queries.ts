import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

export class NotesQueries {
  static async getNotes() {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required. Please log in again.');
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        handleDbError(error, 'fetch notes');
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      
      // Re-throw the error so the UI can handle it appropriately
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while fetching notes.');
    }
  }

  static async getGroupNotes(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required. Please log in again.');
      }

      // First, get notes shared via the note_group_shares table
      const sharedNotes = await this.getGroupSharedNotes(groupId);
      
      // Also get notes that have this group_id directly (legacy support)
      const { data: legacyGroupNotes, error: legacyError } = await supabase
        .from('notes')
        .select('*')
        .eq('group_id', groupId)
        .order('updated_at', { ascending: false });

      if (legacyError) {
        console.error('Error fetching legacy group notes:', legacyError);
      }

      // Combine both results and remove duplicates
      const allNotes = [...sharedNotes, ...(legacyGroupNotes || [])];
      const uniqueNotes = Array.from(
        new Map(allNotes.map(note => [note.id, note])).values()
      );

      // Sort by updated_at descending
      uniqueNotes.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      return uniqueNotes;
    } catch (error) {
      console.error('Error fetching group notes:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while fetching group notes.');
    }
  }

  static async getNote(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to get note');
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('created_by', session.user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting note:', error);
      throw error;
    }
  }

  // Custom Subjects Methods
  static async getUserSubjects() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('custom_subjects' as any)
        .select('*')
        .eq('created_by', session.user.id)
        .order('name');

      if (error) {
        console.error('Error fetching custom subjects:', error);
        // Return empty array if table doesn't exist yet
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching custom subjects:', error);
      return [];
    }
  }

  // Group Sharing Methods
  static async getNoteSharedGroups(noteId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('note_group_shares' as any)
        .select('group_id, study_groups(id, name)')
        .eq('note_id', noteId);

      if (error) {
        console.error('Error fetching shared groups:', error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching shared groups:', error);
      return [];
    }
  }

  static async getGroupSharedNotes(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('note_group_shares' as any)
        .select('note_id, notes(*)')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching group shared notes:', error);
        return [];
      }

      return (data as any)?.map((item: any) => item.notes).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching group shared notes:', error);
      return [];
    }
  }

  static async getSessionNotes(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        handleDbError(error, 'fetch session notes');
      }

      if (!notes || notes.length === 0) return [];

      const userIds = [...new Set(notes.map(n => n.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', userIds);

      const notesWithProfiles = notes.map(note => {
        const profile = profiles?.find(p => p.user_id === note.created_by);
        return {
          ...note,
          profiles: profile || null
        };
      });

      return notesWithProfiles;
    } catch (error) {
      console.error('Error fetching session notes:', error);
      return [];
    }
  }
}
