import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

async function populateNoteProfiles(notes: any[]) {
  if (!notes || notes.length === 0) return [];

  const userIds = [...new Set(notes.map(n => n.created_by))];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, user_id')
    .in('user_id', userIds);

  if (error) {
    console.error('Error populating note profiles:', error);
    return notes.map(note => ({ ...note, profiles: null }));
  }

  return notes.map(note => {
    const profile = profiles?.find(p => p.user_id === note.created_by);
    return {
      ...note,
      profiles: profile || null
    };
  });
}

async function populateNoteGroupShares(notes: any[]) {
  if (!notes || notes.length === 0) return [];

  const noteIds = notes.map(n => n.id);
  const { data: shares, error } = await supabase
    .from('note_group_shares' as any)
    .select('note_id, group_id, study_groups(id, name, is_public)')
    .in('note_id', noteIds);

  if (error) {
    console.error('Error populating note group shares:', error);
    return notes;
  }

  return notes.map(note => {
    const noteShares = (shares as any[])?.filter(s => s.note_id === note.id) || [];
    const firstShare = noteShares[0];
    const group_id = firstShare?.group_id || note.group_id || null;
    const study_group = firstShare?.study_groups || null;

    return {
      ...note,
      group_id,
      shared_groups: noteShares,
      study_group
    };
  });
}

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

      const notesWithProfiles = await populateNoteProfiles(data || []);
      return await populateNoteGroupShares(notesWithProfiles);
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

      const { data: directNotes } = await supabase
        .from('notes')
        .select('*')
        .eq('group_id', groupId);

      const sharedNotes = await this.getGroupSharedNotes(groupId);
      const combinedNotes = [...(directNotes || [])];
      for (const sn of sharedNotes) {
        if (!combinedNotes.some(n => n.id === sn.id)) {
          combinedNotes.push(sn);
        }
      }

      const notesWithProfiles = await populateNoteProfiles(combinedNotes);
      return await populateNoteGroupShares(notesWithProfiles);
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

      const [noteWithShares] = await populateNoteGroupShares([data]);
      return noteWithShares;
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
        .select('group_id, study_groups(id, name, is_public)')
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

      const notesWithProfiles = await populateNoteProfiles(notes || []);
      return await populateNoteGroupShares(notesWithProfiles);
    } catch (error) {
      console.error('Error fetching session notes:', error);
      return [];
    }
  }
}
