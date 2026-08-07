import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

const NOTE_JOIN_SELECT = `
  *,
  note_group_shares(group_id, study_groups(id, name, is_public))
`;

const NOTE_LIST_SELECT = `
  id, title, subject, file_url, file_name, permission_level, created_at, updated_at, created_by, session_id, tags, is_collaborative,
  note_group_shares(group_id, study_groups(id, name, is_public))
`;

async function populateNoteProfiles(rawNotes: Array<Record<string, any>>) {
  if (!rawNotes || rawNotes.length === 0) return rawNotes;

  const userIds = Array.from(new Set(rawNotes.map(n => n.created_by).filter(Boolean)));
  if (userIds.length === 0) return rawNotes;

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, user_id')
    .in('user_id', userIds);

  if (profilesError) {
    console.warn('Error fetching profiles for notes:', profilesError);
    return rawNotes;
  }

  const profiles = profilesData || [];
  const profileMap = profiles.reduce((acc: Record<string, any>, p: any) => {
    if (p && p.user_id) acc[p.user_id] = p;
    return acc;
  }, {});

  return rawNotes.map(n => ({
    ...n,
    profiles: profileMap[n.created_by] || null
  }));
}

function transformJoinedNote(rawNote: Record<string, unknown> | null) {
  if (!rawNote) return null;
  const noteShares = (rawNote.note_group_shares as Array<Record<string, unknown>>) || [];
  const firstShare = noteShares[0];
  const group_id = firstShare?.group_id || null;
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

      const notesWithProfiles = await populateNoteProfiles(data || []);
      return transformJoinedNotes(notesWithProfiles || []);
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

      const [noteWithProfile] = await populateNoteProfiles([data]);
      return transformJoinedNote(noteWithProfile);
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
      const notesWithProfiles = await populateNoteProfiles(rawNotes);
      return transformJoinedNotes(notesWithProfiles || []);
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

      const notesWithProfiles = await populateNoteProfiles(notes || []);
      return transformJoinedNotes(notesWithProfiles || []);
    } catch (error) {
      console.error('Error fetching session notes:', error);
      return [];
    }
  }
}

