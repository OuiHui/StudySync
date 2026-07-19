import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RealtimeService, RealtimeNote } from '@/services/realtime';
import { NotesService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CollaborativeNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  group_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_collaborative: boolean;
  permission_level: string;
  file_url?: string;
  file_name?: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const getNotesQueryKey = (groupId?: string, userId?: string) =>
  groupId ? ['notes', 'group', groupId] : ['notes', 'user', userId];

export const useCollaborativeNotes = (groupId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [onlineCollaborators, setOnlineCollaborators] = useState<Record<string, any[]>>({});

  const queryKey = getNotesQueryKey(groupId, user?.id);

  const {
    data: notes = [],
    isLoading: loading,
    error,
    refetch: loadNotes
  } = useQuery<CollaborativeNote[], Error>({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      if (groupId) {
        const res = await NotesService.getGroupNotes(groupId);
        return (res || []) as CollaborativeNote[];
      } else {
        const res = await NotesService.getNotes();
        return (res || []) as CollaborativeNote[];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const params = groupId ? { groupId } : { userId: user.id };

    // Subscribe to note changes
    RealtimeService.subscribeToNotes(
      params,
      (newNote: RealtimeNote) => {
        const collaborativeNote = newNote as unknown as CollaborativeNote;
        queryClient.setQueryData<CollaborativeNote[]>(queryKey, (old = []) => {
          if (old.some(n => n.id === collaborativeNote.id)) return old;
          return [...old, collaborativeNote];
        });
        
        // Show toast for notes from other users
        if (newNote.created_by !== user.id) {
          toast({
            title: "New note added",
            description: `${newNote.profiles?.display_name || 'Someone'} added "${newNote.title}"`,
          });
        }
      },
      (updatedNote: RealtimeNote) => {
        const collaborativeNote = updatedNote as unknown as CollaborativeNote;
        queryClient.setQueryData<CollaborativeNote[]>(queryKey, (old = []) =>
          old.map(note => (note.id === updatedNote.id ? collaborativeNote : note))
        );
        
        // Show toast for updates from other users
        if (updatedNote.created_by !== user.id) {
          toast({
            title: "Note updated",
            description: `${updatedNote.profiles?.display_name || 'Someone'} updated "${updatedNote.title}"`,
          });
        }
      },
      (deletedNoteId: string) => {
        queryClient.setQueryData<CollaborativeNote[]>(queryKey, (old = []) =>
          old.filter(note => note.id !== deletedNoteId)
        );
        
        toast({
          title: "Note deleted",
          description: "A note was removed from the collection",
        });
      }
    );

    // Set up presence tracking for collaborative editing
    if (groupId) {
      RealtimeService.trackPresence(groupId, {
        id: user.id,
        name: user.user_metadata?.display_name || user.email || 'Anonymous',
        avatar: user.user_metadata?.avatar_url,
      });

      RealtimeService.subscribeToPresence(groupId, (presences) => {
        setOnlineCollaborators(presences);
      });
    }

    // Cleanup on unmount
    return () => {
      const channelName = groupId ? `group_notes:${groupId}` : `user_notes:${user.id}`;
      RealtimeService.unsubscribe(channelName);
      
      if (groupId) {
        RealtimeService.unsubscribe(`presence:${groupId}`);
        RealtimeService.untrackPresence(groupId);
      }
    };
  }, [user, groupId, queryKey, queryClient, toast]);

  // Create a new note
  const createNote = useCallback(async (noteData: {
    title: string;
    content: string;
    subject: string;
    is_collaborative?: boolean;
    permission_level?: 'private' | 'friends' | 'group' | 'public';
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newNote = await NotesService.createNote({
        ...noteData,
        group_id: groupId,
        is_collaborative: groupId ? true : (noteData.is_collaborative || false),
        permission_level: noteData.permission_level || (groupId ? 'group' : 'private'),
      });

      queryClient.invalidateQueries({ queryKey });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['notes', 'user', user.id] });
      }
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }, [user, groupId, queryKey, queryClient]);

  // Update a note
  const updateNote = useCallback(async (noteId: string, updates: {
    title?: string;
    content?: string;
    subject?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedNote = await NotesService.updateNote(noteId, updates);
      queryClient.invalidateQueries({ queryKey });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['notes', 'user', user.id] });
      }
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }, [user, groupId, queryKey, queryClient]);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await NotesService.deleteNote(noteId);
      queryClient.invalidateQueries({ queryKey });
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['notes', 'user', user.id] });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }, [user, groupId, queryKey, queryClient]);

  // Broadcast cursor position for collaborative editing
  const broadcastCursor = useCallback((noteId: string, position: number) => {
    if (groupId && user) {
      RealtimeService.broadcast(
        `collaborative_notes:${groupId}`,
        'cursor_position',
        {
          note_id: noteId,
          user_id: user.id,
          user_name: user.user_metadata?.display_name || user.email,
          position,
          timestamp: Date.now(),
        }
      );
    }
  }, [groupId, user]);

  // Subscribe to cursor positions from other users
  const subscribeToCursors = useCallback((onCursorUpdate: (data: any) => void) => {
    if (groupId) {
      RealtimeService.subscribeToBroadcast(
        `collaborative_notes:${groupId}`,
        'cursor_position',
        onCursorUpdate
      );
    }
  }, [groupId]);

  return {
    notes,
    loading,
    error: error ? error.message : null,
    onlineCollaborators,
    createNote,
    updateNote,
    deleteNote,
    loadNotes,
    broadcastCursor,
    subscribeToCursors,
  };
};