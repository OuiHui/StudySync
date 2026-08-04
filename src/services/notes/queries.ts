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

  const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  return notes.map(note => ({
    ...note,
    profiles: profilesMap.get(note.created_by) || null
  }));
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

  const sharesMap = new Map<string, any[]>();
  (shares as any[])?.forEach(share => {
    const list = sharesMap.get(share.note_id) || [];
    list.push(share);
    sharesMap.set(share.note_id, list);
  });

  return notes.map(note => {
    const noteShares = sharesMap.get(note.id) || [];
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

async function populateNoteMetadata(notes: any[]) {
  if (!notes || notes.length === 0) return [];

  const [notesWithProfiles, notesWithShares] = await Promise.all([
    populateNoteProfiles(notes),
    populateNoteGroupShares(notes)
  ]);

  return notes.map((note, index) => ({
    ...note,
    profiles: notesWithProfiles[index]?.profiles || null,
    group_id: notesWithShares[index]?.group_id || note.group_id || null,
    shared_groups: notesWithShares[index]?.shared_groups || [],
    study_group: notesWithShares[index]?.study_group || null
  }));
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

      return await populateNoteMetadata(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);

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

      const sharedNotes = await this.getGroupSharedNotes(groupId);
      return await populateNoteMetadata(sharedNotes);
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

      const [noteWithMetadata] = await populateNoteMetadata([data]);
      return noteWithMetadata;
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

      return await populateNoteMetadata(notes || []);
    } catch (error) {
      console.error('Error fetching session notes:', error);
      return [];
    }
  }
}
