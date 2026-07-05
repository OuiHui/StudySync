import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, Note } from '../utils';

export class NotesMutations {
  static async createNote(noteData: {
    title: string;
    content?: string;
    subject?: string;
    group_id?: string;
    is_collaborative?: boolean;
    permission_level?: 'private' | 'friends' | 'group' | 'public';
    file_url?: string | null;
    file_name?: string | null;
    session_id?: string | null;
  }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create notes');
      }

      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'create note');
      }

      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  static async updateNote(id: string, updates: Partial<Note>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required. Please log in again.');
      }

      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('created_by', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update note');
      }

      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  static async deleteNote(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required. Please log in again.');
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('created_by', session.user.id);

      if (error) {
        handleDbError(error, 'delete note');
      }

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  static async uploadFile(file: File) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to upload files');
      }

      // Create a unique file name with timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${timestamp}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('note-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('note-files')
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        fileName: file.name
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async createSubject(name: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('custom_subjects' as any)
        .insert({ name: name.trim(), created_by: session.user.id })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('You already have a subject with this name');
        }
        throw new Error(`Failed to create subject: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  static async deleteSubject(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('custom_subjects' as any)
        .delete()
        .eq('id', id)
        .eq('created_by', session.user.id);

      if (error) {
        throw new Error(`Failed to delete subject: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  static async shareNoteWithGroups(noteId: string, groupIds: string[]) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Remove existing shares first
      const { error: deleteError } = await supabase
        .from('note_group_shares' as any)
        .delete()
        .eq('note_id', noteId);

      if (deleteError) {
        console.error('Error removing existing shares:', deleteError);
        throw new Error(`Failed to update sharing: ${deleteError.message}`);
      }

      // Add new shares
      if (groupIds.length > 0) {
        const shares = groupIds.map(groupId => ({
          note_id: noteId,
          group_id: groupId
        }));

        const { error } = await supabase
          .from('note_group_shares' as any)
          .insert(shares);

        if (error) {
          console.error('Error sharing note:', error);
          throw new Error(`Failed to share note: ${error.message}`);
        }
      }

      return groupIds;
    } catch (error) {
      console.error('Error sharing note with groups:', error);
      throw error;
    }
  }
}
