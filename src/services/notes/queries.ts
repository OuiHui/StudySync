import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

const NOTE_JOIN_SELECT = `
  *,
  profiles!notes_created_by_fkey(id, display_name, avatar_url, user_id),
  note_group_shares(group_id, study_groups(id, name, is_public))
`;

const NOTE_LIST_SELECT = `
  id, title, subject, file_url, file_name, permission_level, created_at, updated_at, created_by, session_id, group_id, tags, is_collaborative,
  profiles!notes_created_by_fkey(id, display_name, avatar_url, user_id),
  note_group_shares(group_id, study_groups(id, name, is_public))
`;

function transformJoinedNote(rawNote: Record<string, unknown> | null) {
  if (!rawNote) return null;
  const noteShares = (rawNote.note_group_shares as Array<Record<string, unknown>>) || [];
  const firstShare = noteShares[0];
  const group_id = firstShare?.group_id || rawNote.group_id || null;
  const study_group = firstShare?.study_groups || null;

  return {
    ...rawNote,
    profiles: rawNote.profiles || null,
    group_id,
    shared_groups: noteShares,
    study_group
  };
}

function transformJoinedNotes(rawNotes: Array<Record<string, unknown>>) {
  if (!rawNotes || !Array.isArray(rawNotes)) return [];
  return rawNotes.map(transformJoinedNote);
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
        .select(NOTE_LIST_SELECT)
        .order('updated_at', { ascending: false });

      if (error) {
        handleDbError(error, 'fetch notes');
      }

      return transformJoinedNotes(data || []);
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
      return sharedNotes;
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
        .select(NOTE_JOIN_SELECT)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return transformJoinedNote(data);
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
        .from('custom_subjects')
        .select('*')
        .eq('created_by', session.user.id)
        .order('name');

      if (error) {
        console.error('Error fetching custom subjects:', error);
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
        .from('note_group_shares')
        .select('group_id, study_groups(id, name, is_public)')
        .eq('note_id', noteId);

      if (error) {
        console.error('Error fetching shared groups:', error);
        return [];
      }

      return data || [];
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
        .from('note_group_shares')
        .select(`note_id, notes(${NOTE_LIST_SELECT})`)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching group shared notes:', error);
        return [];
      }

      const rawNotes = (data as unknown as Array<{ notes: Record<string, unknown> }>)?.map(item => item.notes).filter(Boolean) || [];
      return transformJoinedNotes(rawNotes);
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
        .select(NOTE_LIST_SELECT)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        handleDbError(error, 'fetch session notes');
      }

      return transformJoinedNotes(notes || []);
    } catch (error) {
      console.error('Error fetching session notes:', error);
      return [];
    }
  }
}

